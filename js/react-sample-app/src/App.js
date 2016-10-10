/* eslint-disable */
/* Let CRA handle linting for sample app */
import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';
import logo from './logo.svg';
import otCore from './ot-core/core.js';
import config from './config.json';
import './App.css';
import 'opentok-solutions-css';

const otCoreOptions = {
  credentials: {
    apiKey: config.apiKey,
    sessionId: config.sessionId,
    token: config.token,
  },
  // A container can either be a query selector or an HTMLElement
  containers: {
    publisher: {
      camera: '#cameraPublisherContainer',
      screen: '#screenPublisherContainer',
    },
    subscriber: {
      camera: '#cameraSubscriberContainer',
      screen: '#screenSubscriberContainer',
    },
    controls: '#controls',
    chat: '#chat',
  },
  packages: ['textChat', 'screenSharing', 'annotation', 'archiving'],
  communication: {
    callProperites: null, // Using default
  },
  textChat: {
    name: ['David', 'Paul', 'Emma', 'George', 'Amanda'][Math.random() * 5 | 0],
    waitingMessage: 'Messages will be delivered when other users arrive',
  },
  screenSharing: {
    extensionID: 'plocfffmbcclpdifaikiikgplfnepkpo',
    annotation: true,
    externalWindow: false,
    dev: true,
    screenProperties: null, // Using default
  },
  annotation: {

  },
  archiving: {
    startURL: 'https://example.com/startArchive',
    stopURL: 'https://example.com/stopArchive',
  },
};

const properCase = text => `${text[0].toUpperCase()}${text.slice(1)}`;

const connectingMask = () =>
  <div className="App-mask">
    <Spinner />
    <div className="message with-spinner">Connecting</div>
  </div>;

const startCallMask = start =>
  <div className="App-mask">
    <div className="message button clickable" onClick={start}>Click to Start Call</div>
  </div>;

const containerClasses = (state) => {
  const { active, meta, localAudioEnabled, localVideoEnabled } = state;
  const sharingScreen = meta ? !!meta.publisher.screen : false;
  const viewingSharedScreen = meta ? meta.subscriber.screen : false;
  const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
  return {
    controlClass: classNames('App-control-container', { 'hidden': !active }),
    localAudioClass: classNames('ots-video-control circle audio', { 'muted': !localAudioEnabled }),
    localVideoClass: classNames('ots-video-control circle video', { 'muted': !localVideoEnabled }),
    cameraPublisherClass: classNames('video-container', { 'small': !!activeCameraSubscribers || sharingScreen }, { 'left': sharingScreen || viewingSharedScreen }),
    screenPublisherClass: classNames('video-container', { 'hidden': !sharingScreen }),
    cameraSubscriberClass: classNames('video-container', { 'hidden': !activeCameraSubscribers },
      `active-${activeCameraSubscribers}`, { 'small': viewingSharedScreen || sharingScreen }
    ),
    screenSubscriberClass: classNames('video-container', { 'hidden': !viewingSharedScreen }),
  };
};

const addSubscriberControls = ({ id }) => {
  const container = document.getElementById(id);
  const controls =
    `<div class="App-subscriber-controls">
      <div class="subscriber-control audio" id="audio-${id}"></div>
      <div class="subscriber-control video" id="video-${id}"></div>
    </div>`
  container.insertAdjacentHTML('afterBegin', controls);
  const toggleRemoteAV = ({ target }) => {
    const enabled = !target.classList.contains('muted');
    otCore[`toggleRemote${properCase(target.id.split('-')[0])}`](id, !enabled);
    target.classList[enabled ? 'add' : 'remove']('muted');
  };
  document.getElementById(`audio-${id}`).addEventListener('click', toggleRemoteAV)
  document.getElementById(`video-${id}`).addEventListener('click', toggleRemoteAV);
};

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      active: false,
      publishers: null,
      subscribers: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
    };
    this.startCall = this.startCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  componentDidMount() {
    otCore.init(otCoreOptions);
    otCore.connect().then(() => this.setState({ connected: true }));
    const events = [
      'subscribeToCamera',
      'unsubscribeFromCamera',
      'subscribeToScreen',
      'unsubscribeFromScreen',
      'startScreenShare',
      'endScreenShare',
    ];

    events.forEach(event => otCore.on(event, (data) => {
      const { subscriber, publishers, subscribers, meta } = data;
      this.setState({ publishers, subscribers, meta }, () => {
        event === 'subscribeToCamera' && addSubscriberControls(subscriber);
      });
    }));
  }

  startCall() {
    this.setState({ active: true });
    otCore.startCall()
      .then(({ publishers, subscribers, meta }) => {
        this.setState({ publishers, subscribers, meta });
      }).catch(error => console.log(error));
  }

  toggleLocalAudio() {
    otCore.toggleLocalAudio(!this.state.localAudioEnabled);
    this.setState({ localAudioEnabled: !this.state.localAudioEnabled });
  }

  toggleLocalVideo() {
    otCore.toggleLocalVideo(!this.state.localVideoEnabled);
    this.setState({ localVideoEnabled: !this.state.localVideoEnabled });
  }

  render() {
    const { connected, active } = this.state;
    const {
      localAudioClass,
      localVideoClass,
      controlClass,
      cameraPublisherClass,
      screenPublisherClass,
      cameraSubscriberClass,
      screenSubscriberClass,
    } = containerClasses(this.state);

    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>OpenTok Accelerator Core</h1>
        </div>
        <div className="App-main">
          <div id="controls" className={controlClass}>
            <div className={localAudioClass} onClick={this.toggleLocalAudio}></div>
            <div className={localVideoClass} onClick={this.toggleLocalVideo}></div>
          </div>
          <div className="App-video-container">
            { !connected && connectingMask() }
            { connected && !active && startCallMask(this.startCall)}
            <div id="cameraPublisherContainer" className={cameraPublisherClass}></div>
            <div id="screenPublisherContainer" className={screenPublisherClass}></div>
            <div id="cameraSubscriberContainer" className={cameraSubscriberClass}></div>
            <div id="screenSubscriberContainer" className={screenSubscriberClass}></div>
          </div>
          <div id="chat" className="App-chat-container"></div>
        </div>
      </div>
    );
  }
}

export default App;
