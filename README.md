1) Introduction
"Adrian's image delivery service" is a serves as microservice capable of sending images in both original and resized resolutions (up to, and including 4k).
It is based upon node.js and can be used both from browser and from command line.

2) Usage
In order to use the microservice, node.js must be installed locally. The microservice was created via VsCode

The microservice can start in two modes (from VsCode):
- single process (default, via node). The "startDefault" script must be used for this mode
- clustered (via pm2 process manager). The "pm2start" script must be used for this mode

Additional scripts:
test - cypress testing (see section 3) 
pm2Stop - <clustered mode only> stops all worker threads
pm2List - <clustered mode only> list of workers and status
pm2Logs - <clustered mode only> logs tail
pm2Monit - <clustered mode only> monitor usage; for example CPU/memory usage)
build - typescript build

After starting the service via one of the two modes described above; a potential client 
must access the localhost hostname on the 3000 port ( localhost:3000 ) in order to use it.

After starting the microserice, the service's clients can access it in several  ways:
- from command line (or via a potential client application)
- from browser, raw input
- from browser, via pug templates

In any of these modes, a client can obtain any of the following:
- service statistics (Original number of files, number of resized files, cache hits, cache misses, total number of cached files, total length of cached files)
- images located in the "<pathToMicroservice>/deliveryService/images" folder
- resized versions of the images placed in the folder mentioned above

If a client attempts to access a file via an incorrect file name, an error will be returned.
If the client attempts resize a file beyond 4k, the original resolution image will be returned.
The microservice can return the original resolution of an image, no matter how big, but not resize it. 
It is assumed that validation will take place when uploading files, in case this is needed.

Images can be added and retrieved without restarting of the service. 
However, it is assumed that validation would prevent invalid file types (e.g. pdf) from being uploaded to the image folder, 
thus, in case a non-image file is placed within the image folder, there is no server side validation taking place to ensure it is in the correct format.

CommandLine usage requires a separate tool in order to connect to the service, in this case, I've used curl
1. Get statistics:
Sample input:
curl  http://localhost:3000/
curl  http://localhost:3000/stats

Sample output:
"Original files: 8 Resized files: 1 cacheHits: 3 cacheMisses: 2 totalNumberOfCachedFiles: 2 totalLengthOfCachedFiles: 403056"

2. Get an image (via CLI/curl).

Sample input (all examples download the image to the filename specified by the -o flag of the curl command):
original resolution file
curl -o TestOrig1.jpg http://localhost:3000/image/img_1.jpg

Try again to get the cached version of it
curl -o TestOrig2.jpg http://localhost:3000/image/img_1.jpg

Also works with png files
curl -o TestPng.png http://localhost:3000/image/img_3.png

3. Get a resized version of the file
curl -o TestResize.jpg http://localhost:3000/image/img_6.jpg?size=1000x1000

also from cache
curl -o TestResizeCache.jpg http://localhost:3000/image/img_6.jpg?size=1000x1000

4. attempt to get (and resize) invalid file
curl -o TestInvalidFile.jpg http://localhost:3000/image/INVALID_6.jpg?size=1000x1000

Sample output:
"curl : File INVALID_6.jpg not found"

Browser usage is similar to command line/programmatic usage. 
Accessing a URL, as mentioned above, would yield the same result as via the command line interface. 

Sample input
http://localhost:3000/image/img_6.jpg?size=1000x1000
 
In addition to the way described above, the service also uses pug templates to display a more front-end oriented version of statistics and images
Sample input 
http://localhost:3000/stats/page
http://localhost:3000/image/img_5.jpg/page?size=1600x1400
 
The pug template pages are intended for manual testing purposes only. 
 
3) Automated testing
The image delivery microservice uses Cypress as a test automation framework/bundle.

Tests are located in <pathToMicroservice>/deliveryService/cypress/integration.
Six tests are available, spread across 3 files, testing routing, retrieving of images, retrieving of images after resizing and getting usage statistics.

In order to run the tests, the following steps must be followed:
3.1 start microservice (e.g. via "startDefault" script). Tests are dependent of service running, otherwise the will fail, as the server is not mocked.
3.2 run the "test" script to start cypress
3.3 wait for cypress to start in a browser
3.4 press the "Run all specs" button in the upper right hand side of the test runner
3.5 the full battery of tests should run automatically. In case a test fails, it will be signaled via a red icon

4) Architecture and technologies used
The resources are organized in the following way (most relevant files/folders only)
deliveryService -> root directory
	- cypress/integration -> automatic tests
	- images -> static assets used by the microservice
	- out -> output directory, javascript files, as output of a typescript build are found in here. also this is the main entry point of the service
	- src -> source directory, holds typescript and pug files
		- routes -> routing, business and application logic
		- views -> pug templates
		- app.ts -> application setup
		- www.ts -> main entry point, server creation, setting of port
		- cypress.json -> cypress configuration file
		- Dockerfile -> for docker deployments/builds
		- package.json -> application configuration
		- tsconfig.json -> typescript configuraiton

The following technologies are used:
- node. All code (with the exceptions of cypress tests, which run from Browser) runs via node
- typescript. All code (tests included, pug not included) is written in typescript, this is then build via the "build" script and run from the "out" folder
- application uses the Express web application framework for application and routing setup
- pm2 process manage is used mainly for clustering of the node app (i.e. spawning separate worker processes, in order to automatically handle load balancing) as well as potentially monitoring
- lru-cache is used to cached images, once they are retrieved, maximum estimated images are ~50 (based upon format, original filesize). They are saved to cache based upon a key combining filename, width and height (both in pixels) and a value consisting of a base64 encoded string
- pug is used for templating and visualization of content in browser. see more information above
- the sharp library is used for gaining information about images (width, height, format) as well as for actual resizing. It was chosen because of its superior performance in comparison to its competitors

5) Optimizations

The following choices were made, in order to improve the service's performance:
- service can run in cluster mode, via the pm2 process manager. pm2 automatically spawns worker processes that can greatly increase supported connections, default configuration spawns as many worker processes as there are cores available on the CPU
- lru-cache is used for caching of the most used combinations of images and resolution
- the sharp library was chosen for processing of images due to its speed (more info can be found here https://sharp.pixelplumbing.com/en/stable/performance/)
- it was decided not to use gzip for image compression; this could improve network usage and CPU load
- files are being buffer-read via readstream, instead of reading whole files, files are read in buffers
6) Next steps

Potential next steps in this service’s development could be

1. implement sync mechanism (redit key/value store) for syncing values across worker threads and lru-cache
2. replace actual node with CDN and/or nginx for serving static assets; more information: https://softwareontheroad.com/nodejs-scalability-issues/
3. implement http/2 (request multiplexing, header compression)
3. additional  automated tests
4. add networking stats (e.g. like those found in the swagger package; https://swaggerstats.io/guide/api.html#fields-parameter) 

7) Typescript Configuration settings
Target Javascript version: es6.
Strict mode enabled.
Source maps are enabled for debugging.