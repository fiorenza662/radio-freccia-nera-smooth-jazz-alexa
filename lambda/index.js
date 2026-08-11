'use strict';

const Alexa = require('ask-sdk-core');

const STREAM_URL = "https://mira.streamerr.co/listen/radio_freccia_nera__smooth_jazz/radio.mp3";
const ART_URL = "https://www.radiofreccianera.com/wp-content/themes/radio-freccia-nera-thematic-network-en-v2.2/assets/img/cards-pro/smooth-jazz.png";
const TITLE_IT = "Radio Freccia Nera Smooth Jazz";
const TITLE_EN = "Radio Freccia Nera Smooth Jazz";
const INTRO_IT = "Radio Freccia Nera Smooth Jazz.";
const INTRO_EN = "Radio Freccia Nera Smooth Jazz.";

function localeOf(handlerInput) {
  return Alexa.getLocale(handlerInput.requestEnvelope) || 'en-GB';
}
function isItalian(handlerInput) {
  return localeOf(handlerInput).toLowerCase().startsWith('it');
}
function title(handlerInput) {
  return isItalian(handlerInput) ? TITLE_IT : TITLE_EN;
}
function intro(handlerInput) {
  return isItalian(handlerInput) ? INTRO_IT : INTRO_EN;
}
function playDirective(handlerInput) {
  const metadata = {
    title: title(handlerInput),
    subtitle: 'Radio Freccia Nera',
    art: { sources: [{ url: ART_URL }] },
    backgroundImage: { sources: [{ url: ART_URL }] }
  };
  return {
    type: 'AudioPlayer.Play',
    playBehavior: 'REPLACE_ALL',
    audioItem: {
      stream: {
        url: STREAM_URL,
        token: 'rfn:smooth-jazz:' + Date.now(),
        offsetInMilliseconds: 0
      },
      metadata
    }
  };
}
function startRadio(handlerInput) {
  if (!STREAM_URL || !STREAM_URL.startsWith('https://')) {
    const msg = isItalian(handlerInput)
      ? 'Questo canale sarà disponibile a breve.'
      : 'This channel will be available soon.';
    return handlerInput.responseBuilder.speak(msg).withShouldEndSession(true).getResponse();
  }
  return handlerInput.responseBuilder
    .speak(intro(handlerInput))
    .addDirective(playDirective(handlerInput))
    .withShouldEndSession(true)
    .getResponse();
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    return startRadio(handlerInput);
  }
};

const PlayRadioIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayRadioIntent';
  },
  handle(handlerInput) {
    return startRadio(handlerInput);
  }
};

const ResumeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.ResumeIntent';
  },
  handle(handlerInput) {
    return startRadio(handlerInput);
  }
};

const StopHandler = {
  canHandle(handlerInput) {
    if (Alexa.getRequestType(handlerInput.requestEnvelope) !== 'IntentRequest') return false;
    const n = Alexa.getIntentName(handlerInput.requestEnvelope);
    return ['AMAZON.StopIntent','AMAZON.CancelIntent','AMAZON.PauseIntent'].includes(n);
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .withShouldEndSession(true)
      .getResponse();
  }
};

const HelpHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const msg = isItalian(handlerInput)
      ? 'Apri questa skill per ascoltare direttamente ' + TITLE_IT + '.'
      : 'Open this skill to listen directly to ' + TITLE_EN + '.';
    return handlerInput.responseBuilder.speak(msg).reprompt(msg).getResponse();
  }
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return startRadio(handlerInput);
  }
};

const AudioPlayerHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope).startsWith('AudioPlayer.');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const PlaybackControllerHandler = {
  canHandle(handlerInput) {
    const t = Alexa.getRequestType(handlerInput.requestEnvelope);
    return t === 'PlaybackController.PlayCommandIssued' || t === 'PlaybackController.PauseCommandIssued';
  },
  handle(handlerInput) {
    const t = Alexa.getRequestType(handlerInput.requestEnvelope);
    if (t === 'PlaybackController.PauseCommandIssued') {
      return handlerInput.responseBuilder.addAudioPlayerStopDirective().getResponse();
    }
    if (STREAM_URL && STREAM_URL.startsWith('https://')) {
      return handlerInput.responseBuilder.addDirective(playDirective(handlerInput)).getResponse();
    }
    return handlerInput.responseBuilder.getResponse();
  }
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.error(JSON.stringify(handlerInput.requestEnvelope.request));
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.error(error.stack || error);
    const msg = isItalian(handlerInput)
      ? 'Si è verificato un problema. Riprova tra poco.'
      : 'There was a problem. Please try again shortly.';
    return handlerInput.responseBuilder.speak(msg).getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayRadioIntentHandler,
    ResumeIntentHandler,
    StopHandler,
    HelpHandler,
    FallbackHandler,
    PlaybackControllerHandler,
    AudioPlayerHandler,
    SystemExceptionHandler,
    SessionEndedHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
