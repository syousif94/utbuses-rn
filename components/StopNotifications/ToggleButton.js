'use strict';
import React, {
  Component,
  Text,
  View,
  TouchableOpacity,
  Image
} from 'react-native';

import alertImage from './img/alert.png'
import closeImage from './img/close.png'
import styles from './ToggleButton.style.js'

class ToggleButton extends Component {

  renderStopsBtn = () => {
    if (this.props.showStops) {
      return (
        <TouchableOpacity onPress={this.props.hide} style={styles.btn}>
          <Image source={closeImage} style={styles.closeImg}/>
        </TouchableOpacity>
      )
    } else {
      return (
        <TouchableOpacity onPress={this.props.show} style={styles.btn}>
          <Image source={alertImage} style={styles.alertImg}/>
        </TouchableOpacity>
      )
    }
  };

  render() {
    return (
      <View style={styles.wrap}>
        { this.renderStopsBtn() }
      </View>
    )
  }
}

export default ToggleButton
