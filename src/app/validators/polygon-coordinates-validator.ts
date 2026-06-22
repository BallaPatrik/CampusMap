import {PathKind, SchemaPath, validate} from '@angular/forms/signals';
import {Position} from 'geojson';

export const polygonCoordinatesValidator = (
  field: SchemaPath<Position[][], 1, PathKind.Child>
) =>
  //with validate() we can define are own validations
  validate(field, ({value}) => {

    //Get the coordinates from the field
    const coords = value();

    //If there are no coordinates, return an error
    if (!coords || coords.length === 0) {
      return {
        kind: 'polygonCoords',
        message: 'Kezdd el a polygon rajzolását!'
      };
    }

    // If there are less than 3 coordinates, return an error
    if (coords[0].length < 3) {
      return {
        kind: 'polygonCoords',
        message: 'A polygonhoz legalább 3 pont szükséges!'
      };
    }

    return null;
  });
