# Modified: Aug 8, 2018 cholen - PEP8 cleanup and add logging module
# Beginning file was zonalStatsFC2.py
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
import datetime
import json
from eros_stats import raster_stats
import os
import sys
import numpy as np
import logging
import traceback

# make the log folder if it doesn't exist
# it will be located in a logs folder in the same location as this script
log_file_dir = os.path.join(sys.path[0], 'logs')
if not os.path.exists(log_file_dir):
    os.makedirs(log_file_dir)

# create logger for use in all functions
time_string = datetime.date.today().strftime('%Y-%m-%d')
log_file_path = os.path.join(log_file_dir,
                             ('error' + time_string + '.txt'))
# choose debug or info level
logging.basicConfig(filename=log_file_path, level=logging.INFO,
                    format='%(asctime)-20s %(message)s')
# logging.basicConfig(filename=log_file_path, level=logging.DEBUG,
#                    format='%(asctime)-20s %(message)s')
# use for debug only
#  logging.getLogger().addHandler(logging.StreamHandler())


def getoutputunitforinputunit(unit):

    rasterpath = str(unit["rasterpath"])
    shapefilepath = str(unit["shapefilepath"])
    shapefilezoneid = str(unit["shapefilezoneid"])
    chosencalculation = str(unit["chosencalculation"])
    excludevalueranges = unit["excludevalueranges"]
    echo = unit["echo"]

    # pass exclude ranges to rasterstats as a string
    # "-9999,9999 -8888,8888 -7777,7777 ... for single values do -9999,9999"
    excludevaluerangesstring = ""
    for pair in excludevalueranges:
        amin = pair[0]
        amax = pair[1]
        aindex = excludevalueranges.index(pair)
        delimiter = ""
        if aindex > 0:
            delimiter = " "
        excludevaluerangesstring = (excludevaluerangesstring + delimiter +
                                    str(amin) + "," + str(amax) + " ")
    excludevaluerangesstring = excludevaluerangesstring[:-1]

    tupleperzoneid = {}
    outputzoneidpolygonpairs = []

    # some rasters on disk are zero bytes
    # use a try catch, so when python encounters one of these files
    # in a batch it doesnt kill the whole batch
    try:
        stats = raster_stats(shapefilepath,
                             rasterpath,
                             stats=['rawpixels'],
                             nodata_value=None,
                             exclude_ranges=excludevaluerangesstring,
                             copy_properties=True)

        # there are multiple polygons per zone id usually
        # standard practice is to represent it as one polygon to the user
        # so if three polys have the same zone id
        # we combine them and present it as one stat for one zoneid
        logging.debug('Stats::'+str(stats))
        for row in stats:

            azoneid = row[shapefilezoneid]
            arawpixels = row['rawpixels']
            arawpixels = arawpixels

            # in rasterstats sometimes there are no pixels for
            # a polygon, in this case rasterstats returns nan or 0
            # for various stats

            if arawpixels is not None:
                if len(arawpixels) > 0:
                    if azoneid not in tupleperzoneid:
                        tupleperzoneid[azoneid] = (azoneid, arawpixels)
                    else:
                        existingrawpixels = tupleperzoneid[azoneid][1]
                        crawpixels = []
                        crawpixels.extend(existingrawpixels)
                        crawpixels.extend(arawpixels)
                        tupleperzoneid[azoneid] = (azoneid, crawpixels)

        for key in tupleperzoneid.keys():

            azoneidpolygonpair = {}
            atuple = tupleperzoneid[key]
            azoneid = atuple[0]
            acombinedrawpixels = atuple[1]

            # take the stats of the combined pixels array for the
            # polygons with the same zoneid

            acombinedstat = None
            if chosencalculation == 'median':
                acombinedstat = float(np.median(acombinedrawpixels))
            if chosencalculation == 'mean':
                acombinedstat = float(np.mean(acombinedrawpixels))
            if chosencalculation == 'sum':
                acombinedstat = float(np.sum(acombinedrawpixels))
            if chosencalculation == 'max':
                acombinedstat = float(np.max(acombinedrawpixels))
            if chosencalculation == 'min':
                acombinedstat = float(np.min(acombinedrawpixels))

            azoneidpolygonpair["shapefilezoneid"] = azoneid
            azoneidpolygonpair["value"] = acombinedstat
            outputzoneidpolygonpairs.append(azoneidpolygonpair)

    except Exception as e:
        tb = sys.exc_info()[2]
        exctype, excvalue = sys.exc_info()[:2]
        tbinfo = traceback.format_tb(tb)[0]
        err_msg = ('PYTHON ERRORS:\nTraceback Info:\n' + tbinfo +
                   '\nError Info:\n\t' + str(exctype) + ': ' + str(excvalue) +
                   '\n\tRaster: ' + rasterpath +
                   '\n\tShapefile: ' + shapefilepath +
                   '\n\t\t' + str(e) + '\n')
        logging.error(err_msg)
        # re-raise the last exception
        raise

    outputunit = None

    if len(outputzoneidpolygonpairs) > 0:
        outputunit = {}
        outputunit['zoneidpolygonpairs'] = outputzoneidpolygonpairs
        outputunit['echo'] = echo
    return outputunit


if __name__ == '__main__':
    rawinputjsontext = sys.argv[1]
    logging.debug("raw input: " + rawinputjsontext)

    #rawinputjsontext = "{\"list\":[{\"rasterpath\":\"C:\\\\Users\\\\pmainali\\\\Documents\\\\Data\\\\RFE2\\\\Africa\\\\dekads\\\\data.2017.101.tiff\",\"excludevalueranges\":[[-9999.0,-9999.0]],\"shapefilepath\":\"C:\\\\Users\\\\pmainali\\\\Documents\\\\Data\\\\shapefiles\\\\cropzones.shp\",\"echo\":{\"statsJobId\":1},\"shapefilezoneid\":\"FEWS_ID\",\"chosencalculation\":\"min\"},{\"rasterpath\":\"C:\\\\Users\\\\pmainali\\\\Documents\\\\Data\\\\RFE2\\\\Africa\\\\dekads\\\\data.2017.093.tiff\",\"excludevalueranges\":[[-9999.0,-9999.0]],\"shapefilepath\":\"C:\\\\Users\\\\pmainali\\\\Documents\\\\Data\\\\shapefiles\\\\cropzones.shp\",\"echo\":{\"statsJobId\":1},\"shapefilezoneid\":\"FEWS_ID\",\"chosencalculation\":\"min\"} ]}"

    ij = json.loads(rawinputjsontext)
    logging.debug("input arguments as json: " + str(ij))

    # linux 2.7 has a bug in the python json library
    # it just returns the json string if it is not in unicode format
    # they decided to leave the bug in for 2.7
    # it is fixed in python 3.0+
    # https://bugs.python.org/issue11489
    # this is the workaround to make it work on linux
    # if it returns a unicode string, then put the unicode version
    # through the json.loads one more time
    # the second time it will return a python json object

    if type(ij) is unicode:
        ij = json.loads(ij)

    outputunits = []
    for unit in ij["list"]:
        ounit = getoutputunitforinputunit(unit)
        outputunits.append(ounit)

    # filter out any results that returned as "None" (failed)
    foutputunits = filter(lambda a: a is not None, outputunits)

    outputjson = {}
    outputjson["list"] = foutputunits
    outputjsontext = json.dumps(outputjson)

    logging.debug('output json string:  ' + outputjsontext)
    print outputjsontext
    sys.exit()
