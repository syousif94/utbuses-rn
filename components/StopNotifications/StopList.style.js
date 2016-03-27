'use strict';
import React, {
  StyleSheet
} from 'react-native';

const styles = StyleSheet.create({
  list: {
    position: 'absolute',
    bottom: 85,
    right: 25,
    left: 25,
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 370,
    overflow: 'hidden'
  },
  rowWrap: {
    height: 50,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#e0e0e0'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerWrap: {
    width: 53,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center'
  },
  marker: {
    height: 10,
    width: 10,
    borderRadius: 5
  },
  listText: {
    fontSize: 18,
    color: '#000'
  },
})

export default styles
