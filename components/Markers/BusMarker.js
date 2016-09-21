'use strict';
import React, {
  Component,
  Text,
  View,
} from 'react-native';

import styles from './BusMarker.style.js'

class BusMarker extends Component {
  render() {
    let time = ''
    const lastUpdate = this.props.bus.vehicle.timestamp * 1000
    const difference = (this.props.time - lastUpdate) / 1000
    if (difference < 60) {
      const seconds = parseInt(difference)
      time = `${seconds}s`
    } else if (60 <= difference && difference < 3600) {
      const minutes = parseInt(difference/60)
      time = `${minutes}m`
    } else {
      const hours = parseInt(difference/3600)
      time = `${hours}h`
    }
    return (
      <View style={styles.marker}>
        <Text style={styles.ageText}>{time}</Text>
      </View>
    )
  }
}

export default BusMarker
