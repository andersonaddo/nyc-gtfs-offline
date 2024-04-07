I've often found it annoying how it was difficult to find software that provided an interactive offline interface to information about NYC transit lines.

Everything requires internet, which is stupid since you famously don't have access to it when you're in the NYC subway.

I decided to make something to solve this.

The MTA ([like many transit agencies worldwide](https://mobilitydatabase.org/)) has [information](https://new.mta.info/developers) about their lines in [GTFS](https://gtfs.org/schedule/reference/) format, so I decided to work with that (makes things easier for me and makes any solution I find general to any agency).

I found a good GTFS parser online [here](https://github.com/blinktaginc/gtfs-to-html), which also has a demo [here](https://run.gtfstohtml.com/).

That demo makes a website that you can use to interact with the GTFS data, but also gives you a link to download the source code of that website. Perfect!

There's still more work to be done, though, because that source code still doesn't behave very well without internet. Thats where this repo comes in. 

1. Provide this repo a zip file from that demo. Put it in the repo root.
2. Run the script  `npm run script ` That does a couple of things:
   1. It inlines the css and js that the html relies on
   2. It further inlines some styles that the mapbox map relies on to render (rendering will still be janky but at least you can see the subway lines on the map's `<canvas>` now)
   3. Creates an index of lines and which stops they stop at
   4. Adds a search bar for that index
   5. Adds a checkbox to filer to schedules only relevant to the day you're viewing the page on (only supports "Sat", "Sun" and "Mon-Fri" since I'm lazy)
   6. Adds a button on all non-index.html pages to go back to the index.html

Ideally that would be all that's needed, but Android doesn't properly support interactive with offline websites since it doesn't have a proper mapping of local link names to the files they point to. In other words, it doesn't properly support the file:/// format for URIs. You can see folks complaining about that [here](https://www.reddit.com/r/AndroidQuestions/comments/1apox9y/browse_local_set_of_html_pages_in_android/). It has to do with security and lac of standardization of the Android file system.

So there's still work to be done! This is where capacitorjs (v5) comes in.

1. After you've run that script, run `npm run sync ` to map the final output into the Android project
2. Then run either `npm run run_android` to run it in an emulator or `npm run build_android` to make a debug apk (which will be placed in the project root.)
   1. Keep in mind that these two commands need the [Android SDK](https://capacitorjs.com/docs/getting-started/environment-setup) and [Java SDK v17 (specifically 17)](https://github.com/ionic-team/capacitor/discussions/7053).