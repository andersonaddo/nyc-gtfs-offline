import { execSync } from 'child_process';
import decompress from 'decompress';
import { cpSync, existsSync, rmSync, readFileSync } from 'fs'; // Added for fs.cpSync
import { readFile, writeFile } from "fs/promises";
import { glob } from 'glob';
import { v10style } from './res/v10-style';
import { JSDOM } from "jsdom"

let totalHtmlFileCount = 0
let htmlFilesDoneSoFar = 0

async function inlineRequirementsAndReplaceStyles(filePath: string): Promise<void> {
    // Hacky but it works
    execSync(`inliner -n -m -i --preserve-comments "${filePath.replace(FOLDER_INLINED, FOLDER_UNZIPPED)}" > "${filePath}"`, { stdio: 'inherit' });
    htmlFilesDoneSoFar++
    console.log(`Completed inlined file ${htmlFilesDoneSoFar} / ${totalHtmlFileCount} (${filePath})`)
}

async function replaceStrings(filePath: string): Promise<void> {
    const data: string = await readFile(filePath, 'utf8');
    const newData = data.replace("'mapbox://styles/mapbox/light-v10'", v10style);
    await writeFile(filePath, newData, 'utf8');
    htmlFilesDoneSoFar++
    console.log(`Completed string replaced file ${htmlFilesDoneSoFar} / ${totalHtmlFileCount} (${filePath})`)
}

async function indexStops(filePath: string, outputDict: Record<string, string[]>): Promise<void> {
    const data: string = await readFile(filePath, 'utf8');
    const dom = new JSDOM(data);
    const allStops = Array.from(dom.window.document.querySelectorAll(".stop-name")).map(x => x.textContent?.trim()).filter(x => x !== undefined) as string[]
    const fileName = filePath.split("/").at(-1)
    if (!fileName) throw "Missing filename!"
    htmlFilesDoneSoFar++
    outputDict[fileName] = allStops
    console.log(`Completed indexed file ${htmlFilesDoneSoFar} / ${totalHtmlFileCount} (${filePath})`)
}

async function injectScript(filePath: string, scriptStr: string): Promise<void> {
    const scriptTag = `<script>  window.onload = function() {
        ${scriptStr}
      };
      </script>`
    let data: string = await readFile(filePath, 'utf8');
    //Add in this new script before the first script tag
    const scriptIndex = data.indexOf("<script>");
    if (scriptIndex !== -1) {
        data = data.slice(0, scriptIndex) + scriptTag + data.slice(scriptIndex);
        await writeFile(filePath, data, 'utf8');
    }
    htmlFilesDoneSoFar++
    console.log(`Completed injected file ${htmlFilesDoneSoFar} / ${totalHtmlFileCount} (${filePath})`)
}

async function injectBackButtonScript(filePath: string, scriptStr: string): Promise<void> {
    const scriptTag = `<script>  window.onload = function() {
        ${scriptStr}
      };
      </script>`
    let data: string = await readFile(filePath, 'utf8');
    //Add in this new script before the first script tag
    const scriptIndex = data.indexOf("<script>");
    if (scriptIndex !== -1) {
        data = data.slice(0, scriptIndex) + scriptTag + data.slice(scriptIndex);
        await writeFile(filePath, data, 'utf8');
    }
    htmlFilesDoneSoFar++
    console.log(`Completed injected file (for back button) ${htmlFilesDoneSoFar} / ${totalHtmlFileCount} (${filePath})`)
}


async function batchedPromiseAll(
    items: Array<any>,
    batchSize: number,
    fn: (item: any) => Promise<void>,
): Promise<any> {
    for (let start = 0; start < items.length; start += batchSize) {
        const end = Math.min(start + batchSize, items.length)
        await Promise.all(items.slice(start, end).map(fn));
    }
}

const FOLDER_INTERMEDIATES = "./intermediates";
const FOLDER_UNZIPPED = "./intermediates/1-unzipped";
const FOLDER_INLINED = "./intermediates/2-inlined";
const FOLDER_STRING_REPLACED = "./intermediates/3-str_replaced";
const FOLDER_INJECT_SCRIPT = "./intermediates/4-inject_script";
const FOLDER_FINAL_OUTPUT = "./final_output";
const makeFileNameRelative = (path: string) => "./" + path;
const PROMISE_BATCH_SIZE = 20;

let paths: string[] = [];
let htmlFiles: string[] = [];

(async () => {
    try {
        // STEP ZERO: cleanup
        if (existsSync(FOLDER_INTERMEDIATES)) rmSync(FOLDER_INTERMEDIATES, { force: true, recursive: true })

        // STEP ONE: unzip
        const zipFile = glob.globSync("*.zip", { nodir: true }).at(0);
        if (!zipFile) {
            console.log("no zip file!")
            return
        }
        await decompress(makeFileNameRelative(zipFile), FOLDER_UNZIPPED)

        // STEP 2: Inline dependencies
        cpSync(FOLDER_UNZIPPED, FOLDER_INLINED, { recursive: true });
        paths = glob.globSync(FOLDER_INLINED + '/**/*', { nodir: true });
        htmlFiles = paths.filter(path => path.endsWith(".html"))
        totalHtmlFileCount = htmlFiles.length
        htmlFilesDoneSoFar = 0
        await batchedPromiseAll(htmlFiles, PROMISE_BATCH_SIZE, (file) => inlineRequirementsAndReplaceStyles(makeFileNameRelative(file)))

        // STEP 3: Replace strings
        cpSync(FOLDER_INLINED, FOLDER_STRING_REPLACED, { recursive: true });
        paths = glob.globSync(FOLDER_STRING_REPLACED + '/**/*', { nodir: true });
        htmlFiles = paths.filter(path => path.endsWith(".html"))
        totalHtmlFileCount = htmlFiles.length
        htmlFilesDoneSoFar = 0
        await batchedPromiseAll(htmlFiles, PROMISE_BATCH_SIZE, (file) => replaceStrings(makeFileNameRelative(file)))

        // STEP 4a: Index the stops in the non-index html files
        const filenameToStopsDict: Record<string, string[]> = {}
        paths = glob.globSync(FOLDER_STRING_REPLACED + '/**/*', { nodir: true });
        htmlFiles = paths.filter(path => path.endsWith(".html") && !path.endsWith("index.html"))
        totalHtmlFileCount = htmlFiles.length
        htmlFilesDoneSoFar = 0
        await batchedPromiseAll(htmlFiles, PROMISE_BATCH_SIZE, (file) => indexStops(makeFileNameRelative(file), filenameToStopsDict))

        // STEP 4b: Inject userscript for searchbar and checkbox
        cpSync(FOLDER_STRING_REPLACED, FOLDER_INJECT_SCRIPT, { recursive: true });
        let scriptStr = readFileSync("./res/ui-script.js", 'utf8');
        scriptStr = scriptStr.replace("const path_index = {}", `const path_index = ${JSON.stringify(filenameToStopsDict)}`)
        paths = glob.globSync(FOLDER_INJECT_SCRIPT + '/**/*', { nodir: true });
        htmlFiles = paths.filter(path => path.endsWith("index.html"))
        totalHtmlFileCount = htmlFiles.length
        htmlFilesDoneSoFar = 0
        await batchedPromiseAll(htmlFiles, PROMISE_BATCH_SIZE, (file) => injectScript(makeFileNameRelative(file), scriptStr))

        // STEP 4c: Inject userscript for back button
        scriptStr = readFileSync("./res/back-button-script.js", 'utf8');
        paths = glob.globSync(FOLDER_INJECT_SCRIPT + '/**/*', { nodir: true });
        htmlFiles = paths.filter(path => path.endsWith(".html") && !path.endsWith("index.html"))
        totalHtmlFileCount = htmlFiles.length
        htmlFilesDoneSoFar = 0
        await batchedPromiseAll(htmlFiles, PROMISE_BATCH_SIZE, (file) => injectBackButtonScript(makeFileNameRelative(file), scriptStr))

        // STEP 5: Copy to final output
        cpSync(FOLDER_INJECT_SCRIPT, FOLDER_FINAL_OUTPUT, { recursive: true });
    } catch (err: any) {
        console.log(err)
    }
})();
