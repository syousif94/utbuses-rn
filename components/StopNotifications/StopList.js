'use strict';
import React, {
  Component,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  AsyncStorage
} from 'react-native';

import OneSignal from 'react-native-onesignal';
import styles from './StopList.style.js'

class StopListRow extends Component {
  subscribe = () => {
    var id = this.props.stop.id
    this.props.subscribe(id)
  };

  render() {
    const border = (this.props.stop.id === 0) ? {
      borderTopWidth: 0,
      height: 49
    } : null
    const stopId = 'wc' + this.props.stop.id
    var isEnabled = false
    if (this.props.enabled) {
      isEnabled = this.props.enabled[stopId] === '1'
    }
    const markerColor = {
      backgroundColor: (isEnabled) ? '#9013FE' : '#e0e0e0'
    }
    return (
      <View style={[styles.rowWrap, border]}>
        <TouchableOpacity onPress={this.subscribe} style={styles.row}>
          <View style={styles.markerWrap}>
            <View style={[styles.marker, markerColor]}/>
          </View>
          <Text style={styles.listText}>{this.props.stop.name}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

function getTags() {
  return new Promise((resolve, reject) => {
    OneSignal.idsAvailable((idsAvailable) => {
      var id = idsAvailable.userId
      if (!id) {
        resolve({})
        return
      } 
      var players = 'https://onesignal.com/api/v1/players/'
      var url = players + id
      fetch(url).then((response) => response.json())
      .then((json) => {
        resolve(json.tags)
      })
    })
  })
}

class StopList extends Component {
  constructor() {
    super()
    this.state = {
      loading: true,
      isRefreshing: false,
      enabled: {}
    }
  }

  componentDidMount() {
    AsyncStorage.getItem('wcNotifications').then((value) => {
      if (!value) {
        getTags().then((receivedTags) => {
          var tags = ''
          if (receivedTags) {
            tags = JSON.stringify(receivedTags)
          }
          AsyncStorage.setItem('wcNotifications', tags)
          this.setState({
            loading: false,
            enabled: receivedTags
          })
        })
      } else if (value == '') {
        this.setState({
          loading: false
        })
      } else {
        var enabled = JSON.parse(value)
        this.setState({
          loading: false,
          enabled: enabled
        })
      }
    })
  }

  subscribeToStop = (stopId) => {
    const tagName = 'wc' + stopId
    var enabled = this.state.enabled
    if (enabled && enabled[tagName] === '1') {
      var tags = {}
      tags[tagName] = 2
      OneSignal.sendTags(tags)
      delete enabled[tagName]
      this.setState({
        enabled: enabled
      })
      var notifications = ''
      if (enabled) {
        notifications = JSON.stringify(enabled)
      }
      AsyncStorage.setItem('wcNotifications', notifications)
    } else {
      var tags = {}
      tags[tagName] = 1
      OneSignal.sendTags(tags)
      var enabled = (this.state.enabled) ? this.state.enabled : {}
      enabled[tagName] = '1'
      this.setState({
        enabled: enabled
      })
      var notifications = ''
      if (enabled) {
        notifications = JSON.stringify(enabled)
      }
      AsyncStorage.setItem('wcNotifications', notifications)
    }
  };

  onRefresh = () => {
    this.setState({
      isRefreshing: true
    })
    getTags().then((receivedTags) => {
      var tags = ''
      if (receivedTags) {
        tags = JSON.stringify(receivedTags)
      }
      AsyncStorage.setItem('wcNotifications', tags)
      this.setState({
        isRefreshing: false,
        enabled: receivedTags
      })
    })
  };

  render() {
    const pointerEvents = (this.props.showStops) ? "auto" : "none"
    const opacity = (this.props.showStops) ? 1 : 0
    const style = {
      opacity: opacity
    }
    return (
      <View style={[styles.list, style]} pointerEvents={pointerEvents}>
        <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={this.state.isRefreshing}
            onRefresh={this.onRefresh}
            tintColor="#ccc"
            title="Refreshing..."
            colors={['#fff']}
            progressBackgroundColor="#ccc"
          />
        }>
          {this.props.stops.map((stop) => {
            const id = stop.id
            return (
              <StopListRow
                enabled={this.state.enabled}
                stop={stop}
                key={id}
                subscribe={this.subscribeToStop}
              />
            )
          })}
        </ScrollView>
      </View>
    )
  }

}

export default StopList
