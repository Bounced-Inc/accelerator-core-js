/* global otCore */

const options = {
  credentials: {
    apiKey: 'YOUR_API_KEY',
    sessionId: 'YOUR_SESSION_ID',
    token: 'YOUR_TOKEN',
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
    name: ['David', 'Paul', 'Emma', 'George', 'Amanda'][Math.random() * 5 | 0], // eslint-disable-line no-bitwise
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

const app = () => {
  const state = {
    connected: false,
    active: false,
    publishers: null,
    subscribers: null,
    localAudioEnabled: true,
    localVideoEnabled: true,
  };

  const updateVideoContainers = () => {
    const { meta } = state;
    const sharingScreen = meta ? !!meta.publisher.screen : false;
    const viewingSharedScreen = meta ? meta.subscriber.screen : false;
    const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;

    const cameraPublisherClass =
      `video-container ${!!activeCameraSubscribers || sharingScreen ? 'small' : ''} ${sharingScreen || viewingSharedScreen ? 'left' : ''}`;
    document.getElementById('cameraPublisherContainer').setAttribute('class', cameraPublisherClass);

    const screenPublisherClass = `video-container ${!sharingScreen ? 'hidden' : ''}`;
    document.getElementById('screenPublisherContainer').setAttribute('class', screenPublisherClass);

    const cameraSubscriberClass =
      `video-container ${!activeCameraSubscribers ? 'hidden' : ''} active-${activeCameraSubscribers} ${viewingSharedScreen || sharingScreen ? 'small' : ''}`;
    document.getElementById('cameraSubscriberContainer').setAttribute('class', cameraSubscriberClass);

    const screenSubscriberClass = `video-container ${!viewingSharedScreen ? 'hidden' : ''}`;
    document.getElementById('screenSubscriberContainer').setAttribute('class', screenSubscriberClass);
  };

  const updateUI = (update) => {
    const { connected, active } = state;

    switch (update) {
      case 'connected':
        if (connected) {
          document.getElementById('connecting-mask').classList.add('hidden');
          document.getElementById('start-mask').classList.remove('hidden');
        }
        break;
      case 'active':
        if (active) {
          document.getElementById('start-mask').classList.add('hidden');
          document.getElementById('controls').classList.remove('hidden');
        }
        break;
      case 'meta':
        updateVideoContainers();
        break;
      default:
        console.log('nothing to do, nowhere to go');
    }
  };

  const addSubscriberControls = ({ id }) => {
    const container = document.getElementById(id);
    const controls =
      `<div class="App-subscriber-controls">
        <div class="subscriber-control audio" id="audio-${id}"></div>
        <div class="subscriber-control video" id="video-${id}"></div>
      </div>`;
    container.insertAdjacentHTML('afterBegin', controls);
    const toggle = ({ target }) => {
      const enabled = !target.classList.contains('muted');
      otCore[`toggleRemote${properCase(target.id.split('-')[0])}`](id, !enabled);
      target.classList[enabled ? 'add' : 'remove']('muted');
    };
    document.getElementById(`audio-${id}`).addEventListener('click', toggle)
    document.getElementById(`video-${id}`).addEventListener('click', toggle);
  };

  const updateState = (updates) => {
    Object.assign(state, updates);
    Object.keys(updates).forEach(update => updateUI(update));
  };

  const startCall = () => {
    updateState({ active: true });
    otCore.startCall()
      .then(({ publishers, subscribers, meta }) => {
        updateState({ publishers, subscribers, meta });
      }).catch(error => console.log(error));
  };

  const toggleLocalAudio = () => {
    const enabled = state.localAudioEnabled;
    otCore.toggleLocalAudio(!enabled);
    updateState({ localAudioEnabled: !enabled });
    const action = enabled ? 'add' : 'remove';
    document.getElementById('toggleLocalAudio').classList[action]('muted');
  };

  const toggleLocalVideo = () => {
    const enabled = state.localVideoEnabled;
    otCore.toggleLocalVideo(!enabled);
    updateState({ localVideoEnabled: !enabled });
    const action = enabled ? 'add' : 'remove';
    document.getElementById('toggleLocalVideo').classList[action]('muted');
  };

  const createEventListeners = () => {
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
      updateState({ publishers, subscribers, meta });
      if (event === 'subscribeToCamera') {
        addSubscriberControls(subscriber);
      }
    }));

    document.getElementById('start').addEventListener('click', startCall);
    document.getElementById('toggleLocalAudio').addEventListener('click', toggleLocalAudio);
    document.getElementById('toggleLocalVideo').addEventListener('click', toggleLocalVideo);
  };

  const init = () => {
    otCore.init(options);
    otCore.connect().then(() => updateState({ connected: true }));
    createEventListeners();
  };

  init();
};

document.addEventListener('DOMContentLoaded', app);
