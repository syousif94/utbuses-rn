/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';
import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated
} from 'react-native';

import stops from './642stops'
import MapView from 'react-native-maps'
import polyline from 'polyline'
import Firebase from 'firebase'
import GeoFire from 'geofire'
import geolib from 'geolib'

let annotations = new Map()
const ref = new Firebase('https://utbusses.firebaseio.com')
const wcRef = ref.child('wcdata')
const geoFire = new GeoFire(ref.child('wc'))

function annotation(key, location, deviceTime, timestamp) {
  this.key = key
  this.coords = {
    latitude: location[0],
    longitude: location[1]
  }
  this.time = deviceTime
  this.timestamp = timestamp
  let time = new Date()
  time.setTime(deviceTime)
  let hours = time.getHours()
  if (hours > 12) {
    hours = hours - 12
  } else if (hours === 0) {
    hours = 12
  }
  let minutes = time.getMinutes()
  if (minutes < 10) {
    minutes = `0${minutes}`
  }
  this.timeStr = `${hours}:${minutes}`
}

function toArray(annotations) {
  let array = []
  annotations.forEach((value, key) => {
    array.push(value)
  })
  return array
}

class UTBuses extends Component {
  constructor() {
    super()
    this.undoInterval = null
    this.locationRef = null
    this.locationKey = null
    this.state = {
      undoCountdown: 5,
      translateWarningBar: new Animated.Value(0),
      btn: 'update',
      annotations: [],
      poly: [],
      time: Date.now()
    }
  }

  componentDidMount() {
    var encoded = "mgzwDrqosQuD@gBL{CfCSNe@T}@VYBm@A[vLSjFMxEwL]Q`FIv@CbDI|HhHZ?@MpC?AI`DKzD?@GbCA~A??QjEvDTdBD~F\\lCJp@FdDLpDTT_ITwHNgERqENyEnFRJaFPeFF_CZuHf@oRJu@uCGoG}@eDa@"
    var poly = polyline.decode(encoded)
    var line = poly.map((coords) => {
      return {
        latitude: coords[0],
        longitude: coords[1],
      }
    })
    this.setState({
      poly: line
    })

    var geoQuery = geoFire.query({
      center: [30.286390, -97.740726],
      radius: 6
    })

    var onKeyEnter = geoQuery.on('key_entered', (key, location, distance) => {
      wcRef.child(key).once('value', (snapshot) => {
        let { deviceTime, timestamp } = snapshot.val()
        let marker = new annotation(key, location, deviceTime, timestamp)
        annotations.set(key, marker)
        let array = toArray(annotations)
        this.setState({
          annotations: array
        })
      })
    })

    var onKeyExit = geoQuery.on('key_exited', (key, location, distance) => {
      annotations.delete(key)
      let array = toArray(annotations)
      this.setState({
        annotations: array
      })
    })

    var ticker = setInterval(() => {
      this.setState({
        time: Date.now()
      })
    }, 1000)
  }

  renderPolyline = () => {
    if (this.state.poly.length) {
      return (
        <MapView.Polyline 
          strokeWidth={4}
          coordinates={this.state.poly}
          strokeColor="rgba(74,144,226,130)"
        />
      )
    } else return null
  };

  undoLocation = () => {
    geoFire.remove(this.locationKey)
    this.locationRef.remove()
    clearInterval(this.undoInterval)
    this.setState({
      undoCountdown: 5,
      btn: 'update'
    })
  };

  updateLocation = () => {
    this.setState({
      btn: 'locating'
    })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let nearby = stops.filter((stop) => {
          const distance = geolib.getDistance( stop, position.coords )
          return distance <= 60.69
        })
        if (nearby.length) {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          this.locationRef = wcRef.push({
            deviceTime: Date.now(),
            timestamp: Firebase.ServerValue.TIMESTAMP
          })
          this.locationKey = this.locationRef.key()
          this.locationRef.then(() => {
            geoFire.set(this.locationKey, [lat, lon]).then(() => {
              this.setState({
                btn: 'undo'
              })
              this.undoInterval = setInterval(() => {
                if (this.state.undoCountdown === 1) {
                  clearInterval(this.undoInterval)
                  this.setState({
                    btn: 'update',
                    undoCountdown: 5
                  })
                } else {
                  this.setState({
                    undoCountdown: this.state.undoCountdown - 1
                  })
                }
              }, 1000)
            })
          })
        } else {
          this.setState({
            btn: 'update'
          })
          Animated.timing(
            this.state.translateWarningBar,
            {
              toValue: 20,
              duration: 500,
            },
          ).start(() => {
            Animated.timing(
              this.state.translateWarningBar,
              {
                toValue: 0,
                duration: 500,
                delay: 2000
              },
            ).start()
          })
        }
      },
      (error) => alert(error.message),
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 1000}
    )
  };

  renderBtn = () => {
    switch (this.state.btn) {
      case 'undo':
        return (
          <TouchableOpacity onPress={this.undoLocation} style={styles.btn}>
            <Text style={styles.undoText}>Undo Location Update</Text>
            <View style={styles.undoCountdown}>
              <Text style={styles.undoCountdownText}>{this.state.undoCountdown}</Text>
            </View>
          </TouchableOpacity>
        )
        break
      case 'locating':
        return (
          <View style={styles.btn}>
            <Text style={styles.locatingText}>Verifying Location</Text>
          </View>
        )
        break
      case 'update':
        return (
          <TouchableOpacity onPress={this.updateLocation} style={styles.btn}>
            <Text style={styles.btnText}>I just got on the bus!</Text>
          </TouchableOpacity>
        )
        break
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>West Campus Bus</Text>
        </View>
        <MapView
          showsUserLocation={true}
          showsPointsOfInterest={false}
          showsCompass={false}
          showsIndoors={false}
          style={ styles.map }
          initialRegion={{
            latitude: 30.286390,
            longitude: -97.740726,
            latitudeDelta: 0.022,
            longitudeDelta: 0.022,
          }}
        >
          { this.renderPolyline() }
          {stops.map((stop, i) => {
            return (
              <MapView.Marker 
                coordinate={stop} 
                key={i}
                anchor={{x: 0.5, y: 0.5}}>
                <View style={styles.stop}/>
              </MapView.Marker>
            )
          })} 
          {this.state.annotations.map((annotation, i) => {
            let difference = this.state.time - annotation.time
            let min = difference / 60000
            let bg = ''
            if (min >= 20) {
              return null
            } else if (min <= 5) {
              bg = '#50AC12'
            } else if (min <= 10) {
              bg = '#F5A623'
            } else {
              bg = '#D0021B'
            }
            let key = `${annotation.key}${bg}`
            return (
              <MapView.Marker 
                coordinate={annotation.coords} 
                key={key}
              >
                <View style={styles.update}>
                  <View style={[styles.updateTime, { backgroundColor: bg } ]}>
                    <Text style={styles.timeText}>{annotation.timeStr}</Text>
                  </View>
                  <View style={[styles.updatePin, { backgroundColor: bg } ]}/>
                </View>
              </MapView.Marker>
            )
          })} 
        </MapView>
        <View style={styles.btnWrap}>
          { this.renderBtn() }
        </View>
        <Animated.View style={[styles.warningBar, { transform: [{translateY: this.state.translateWarningBar}] } ]}>
          <Text style={styles.warningText}>If you're within 200 feet of a stop, please try again.</Text>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: {
    color: '#000',
    fontSize: 18,
  },
  map: {
    flex: 1
  },
  stop: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#157AFC',
  },
  btnWrap: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 4
  },
  btn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: {
    fontSize: 18,
    color: '#157AFC'
  },
  undoText: {
    fontSize: 18,
    color: '#D0021B'
  },
  locatingText: {
    fontSize: 18,
    color: '#ccc'
  },
  update: {
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  updateTime: {
    paddingHorizontal: 5,
    paddingBottom: 1,
    borderRadius: 3,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timeText: {
    fontSize: 14,
    color: '#fff',
  },
  updatePin: {
    height: 4,
    width: 7,
    backgroundColor: '#000',
  },
  warningBar: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9013FE'
  },
  warningText: {
    color: '#fff',
    fontSize: 14
  },
  undoCountdown: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoCountdownText: {
    fontSize: 18,
    color: '#D0021B'
  }
});

AppRegistry.registerComponent('UTBuses', () => UTBuses);
