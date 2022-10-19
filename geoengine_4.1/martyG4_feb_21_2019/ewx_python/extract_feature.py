"""Extract feature values for each layer in a shapefile"""
import argparse
import json
import os
import sys

from osgeo import ogr


def get_feature_values(shp_filepath, field_name):
    """Retrieve values for the specified field from a shapefile and return
    a JSON string.
    
    The returned JSON string contains a 2-d array indexed by layer and 
    feature. For example, a shapefile containing 2 layers with 3 features
    would return a string of the following JSON object::
    
        [
            ['layer1feature1', 'layer1feature2', 'layer1feature3'],
            ['layer2feature1', 'layer2feature2', 'layer2feature3']
        ]
    
    Args:
        shp_filepath (str): Path to a shapefile
        field_name (str): Name of field
        
    Returns:
        str: JSON string
    """
    if not os.path.exists(shp_filepath):
        raise Exception('{} does not exist'.format(shp_filepath))
    
    # Open shapefile in ReadOnly mode
    shape_ds = ogr.Open(shp_filepath, 0)
    if shape_ds is None:
        raise Exception('Error loading shapefile: {}'.format(shp_filepath))
    
    # At least one layer is required
    if shape_ds.GetLayerCount() < 1:
        raise Exception('Shapefile must contain at least one layer')

    result = []
    for layer_idx in xrange(shape_ds.GetLayerCount()):
        layer = shape_ds.GetLayer(layer_idx)
        
        # Find the field name in the layer definition
        layer_field_name = None
        layer_def = layer.GetLayerDefn()
        for ld_idx in xrange(layer_def.GetFieldCount()):
            if field_name.lower() == layer_def.GetFieldDefn(ld_idx).GetName().lower():
                layer_field_name = layer_def.GetFieldDefn(ld_idx).GetName()
                break
        
        if layer_field_name is None:
            raise Exception('Layer {} does not contain field {}'.format(layer.GetName(), 
                                                                        field_name))
            
        # Get field value for each feature
        layer_data = []
        for feature_idx in xrange(layer.GetFeatureCount()):
            feature = layer.GetFeature(feature_idx)
            layer_data.append(feature.GetField(layer_field_name))
            
        result.append(layer_data)
    
    return json.dumps(result)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('filepath', type=str, help='Path to shapefile')
    parser.add_argument('field_name', type=str, help='Name of field to extract')
    parser.add_argument('--outfile', type=str, help='Write output to file')
    
    args = parser.parse_args()
    try:
        json_str = get_feature_values(args.filepath, args.field_name)
        
        if args.outfile:
            data = json.loads(json_str)
            with open(args.outfile, 'w') as fh:
                json.dump(data, fh)
        else:
            print json_str
    except Exception as ex:
        print ex
        sys.exit(1)
        
    sys.exit(0)
