'''

call with python zonalStatsNew.py "jsonononelinehere"


so to make regular json fit for command line
you first have to strip the newlines, then escape the double quotes

command line input string of prettified version below 
"{ \"list\": [ { \"rasterpath\":\"B:\\\\Stornext\\\\scienceweb1\\\\shared\\\\fews\\\\EWX\\\\data\\\\CHIRPS\\\\global\\\\dekads\\\\data.1981.011.tiff\", \"shapefilepath\":\"B:\\\\Stornext\\\\scienceweb1\\\\shared\\\\fews\\\\EWX\\\\data\\\\GAUL\\\\Africa\\\\g2008_1.shp\", \"shapefilezoneid\":\"FEWS_ID\", \"chosencalculation\": \"median\", \"excludevalueranges\": [ [-9999,-9999] ], \"echo\": { \"someid\":1, \"picked\":\"sum\", \"foo\":\"bluesteel\", \"shapefilezoneid\":\"FEWS_ID\" } }, { \"rasterpath\":\"B:\\\\Stornext\\\\scienceweb1\\\\shared\\\\fews\\\\EWX\\\\data\\\\CHIRPS\\\\global\\\\dekads\\\\anom.1981.011.tiff\", \"shapefilepath\":\"B:\\\\Stornext\\\\scienceweb1\\\\shared\\\\fews\\\\EWX\\\\data\\\\GAUL\\\\Africa\\\\g2008_1.shp\", \"shapefilezoneid\":\"FEWS_ID\", \"chosencalculation\": \"mean\", \"excludevalueranges\": [ [-9999,-9999] ], \"echo\": { \"someid\":1, \"picked\":\"sum\", \"foo\":\"bluesteel2\", \"shapefilezoneid\":\"FEWS_ID\" } } ] }"


inputfile.json contents:
{
    "list":
    [
        {
            "rasterpath":"B:\\Stornext\\scienceweb1\\shared\\fews\\EWX\\data\\CHIRPS\\global\\dekads\\data.1981.011.tiff",
            "shapefilepath":"B:\\Stornext\\scienceweb1\\shared\\fews\\EWX\\data\\GAUL\\Africa\\g2008_1.shp",
            "shapefilezoneid":"FEWS_ID",
            "chosencalculation": "median",
            "excludevalueranges":
            [
                [-9999,-9999]
            ],
            "echo":
            {
                "someid":1,
                "picked":"sum",
                "foo":"bluesteel",
                "shapefilezoneid":"FEWS_ID"
            }
        },
        {
            "rasterpath":"B:\\Stornext\\scienceweb1\\shared\\fews\\EWX\\data\\CHIRPS\\global\\dekads\\anom.1981.011.tiff",
            "shapefilepath":"B:\\Stornext\\scienceweb1\\shared\\fews\\EWX\\data\\GAUL\\Africa\\g2008_1.shp",
            "shapefilezoneid":"FEWS_ID",
            "chosencalculation": "mean",
            "excludevalueranges":
            [
                [-9999,-9999]
            ],
            "echo":
            {
                "someid":1,
                "picked":"sum",
                "foo":"bluesteel2",
                "shapefilezoneid":"FEWS_ID"
            }
        }
    ]
}

output json contents:
{
    list:
    [
        {
            zoneidpolygonpairs:
            [
                {shapefilezoneid:"Burundi",value:1.0245}
                {shapefilezoneid:"Libya",value:2.5}
                {shapefilezoneid:"Egypt",value:4.05}
                {shapefilezoneid:"Sudan",value:0.8}
            ],
            echo:
            {
                someid:2,
                picked:"avg",
                bar:"Le Tigre",
                shapefilezoneid:"FEWS_ID"
            }
        },
        {
            zoneidpolygonpairs:
            [
                {shapefilezoneid:"1+22+444",value:1.0245}
                {shapefilezoneid:"3+21+464",value:2.5}
                {shapefilezoneid:"4+20+424",value:4.05}
                {shapefilezoneid:"5+20+433",value:0.8}
            ],
            echo:
            {
                someid:1,
                picked:"sum",
                foo:"bluesteel",
                shapefilezoneid:"FEWS_CODE"
            }
        }
    ]
}

'''

import json
from rasterstats import raster_stats
import math
import sys
from joblib import Parallel,delayed
import numpy as np
from threading import Thread, Lock
import multiprocessing






def getoutputunitforinputunit(unit):

    rasterpath = str(unit["rasterpath"])
    shapefilepath = str(unit["shapefilepath"])
    shapefilezoneid = str(unit["shapefilezoneid"])
    chosencalculation = str(unit["chosencalculation"])
    excludevalueranges = unit["excludevalueranges"]
    echo = unit["echo"]
    
    #print excludevalueranges
    #print "\n"
    #pass exclude ranges to rasterstats as a string "-9999,9999 -8888,8888 -7777,7777 ... for single values do -9999,9999"

    excludevaluerangesstring = ""
    for pair in excludevalueranges:
        amin = pair[0]
        amax = pair[1]
        aindex = excludevalueranges.index(pair)
        delimiter = ""
        if aindex>0:
            delimiter = " "
        excludevaluerangesstring = excludevaluerangesstring + delimiter + str(amin)+","+str(amax) 

    tupleperzoneid = {}
    outputzoneidpolygonpairs = []

    stats = raster_stats(shapefilepath, rasterpath, stats=['rawpixels'], nodata_value=None, exclude_ranges=excludevaluerangesstring, copy_properties=True)

    #there are multiple polygons per zone id usually
    #standard practice is to represent it as one polygon to the user
    #so if three polys have the same zone id
    #we combine them and present it as one stat for one zoneid

    for row in stats:

        azoneid = row[shapefilezoneid]
        arawpixels = row['rawpixels']
        arawpixels = arawpixels

        #if rawpixels.count() > 0:
            #print azoneid+" "+str(rawpixels.count())

        
        #if rawpixels.count() == 1:
            #print azoneid+" "+str(rawpixels.count())
        #print rawpixels

        #print rawpixels
        #continue
        
        
        #in rasterstats sometimes there are no pixels for
        #a polygon, in this case rasterstats returns nan or 0
        #for various stats

        if arawpixels is not None:
            if len(arawpixels) > 0:
                if azoneid not in tupleperzoneid:
                    tupleperzoneid[azoneid] = (azoneid,arawpixels)
                else:
                    existingrawpixels = tupleperzoneid[azoneid][1]
                    crawpixels = []
                    crawpixels.extend(existingrawpixels)
                    crawpixels.extend(arawpixels)
                    tupleperzoneid[azoneid] = (azoneid,crawpixels)



    for key in tupleperzoneid.keys():
        
        azoneidpolygonpair = {}

        atuple = tupleperzoneid[key]

        azoneid = atuple[0]
        acombinedrawpixels = atuple[1]

        #so here I take the stats of the combined pixels array for the polygons
        #with the same zoneid

        acombinedstat = None
        if chosencalculation == 'median':
            acombinedstat = float(np.median(acombinedrawpixels))
        if chosencalculation == 'mean':
            acombinedstat = float(np.mean(acombinedrawpixels))
        if chosencalculation == 'sum':
            acombinedstat = float(np.sum(acombinedrawpixels))

        azoneidpolygonpair["shapefilezoneid"] = azoneid
        azoneidpolygonpair["value"] = acombinedstat
        outputzoneidpolygonpairs.append(azoneidpolygonpair)

    outputunit = {}
    outputunit['zoneidpolygonpairs'] = outputzoneidpolygonpairs
    outputunit['echo'] = echo

    #mutex.acquire()
    #outputunits.append(outputunit)
    #mutex.release()
    return outputunit


if __name__ == '__main__':
    
    rawinputjsontext = sys.argv[1]

    ij = json.loads(rawinputjsontext)

    #linux 2.7 has a bug in the python json library
    #it just returns the json string
    #if it is not in unicode format
    #they decided to leave the bug in for 2.7
    #it is fixed in python 3.0+
    #https://bugs.python.org/issue11489
    #this is the workaround to make it work on linux
    #if it returns a unicode string, then put the unicode version
    #through the json.loads one more time
    #the second time it will return a python json object

    if type(ij) is unicode:
        ij = json.loads(ij)

    #for unit in ij["list"]:
    #    getoutputunitforinputunit(unit)
    num_cores = multiprocessing.cpu_count()
    outputunits = Parallel(n_jobs=num_cores)(delayed(getoutputunitforinputunit)(unit) for unit in ij["list"])

    outputjson = {}
    outputjson["list"] = outputunits
    outputjsontext = json.dumps(outputjson)

    print outputjsontext
