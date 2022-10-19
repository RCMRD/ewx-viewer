from rasterstats import raster_stats
from time import gmtime, strftime
import sys

noDataValue = -9999

stats = raster_stats("C:\EWX\python_scripts\python_test_data/cropzones.shp", "C:\EWX\python_scripts\python_test_data/rfe2.2016.10.tiff", stats=['mean', 'sum', 'count'], nodata_value=noDataValue, copy_properties=True)

for f in stats:
    print f['FEWS_ID'] + ":" + str(f['mean']) + ":" + str(f['count']) + ":" + str(f['sum']) + "\n"

print "End: " + strftime("%Y-%m-%d %H:%M:%S", gmtime()) + "\n"


