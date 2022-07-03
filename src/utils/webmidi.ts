import type { ConnectedDeviceData, DeviceCustomProfile } from "@/stores/webmidi";

import { guessDeviceType } from "@/utils/devices";
import { log } from "@/utils/logger";
import { WebMidi } from "webmidi";

import {
  webMidiDevices,
  setWebMidiDevices,
  setWebMidiInformations
} from "@/stores/webmidi";

export const removeInOutFromName = (name: string) => {
  const regexp = /(IN)|(OUT)/gi;
  name.replace(regexp, "");
  return name;
};

/**
 * This checks for devices and refresh the `webMidiDevices` signal.
 * @param isNewDevices - When `true`, will check for new devices.
 */
const checkWebMidiDevices = async (isNewDevices = true) => {
  console.info("[webmidi]: checking devices...");

  const devices = webMidiDevices();
  const profiles: DeviceCustomProfile[] = JSON.parse(localStorage.getItem("devices") ?? "[]");

  /** Check for connected devices. */
  if (isNewDevices) {
    for (const output of WebMidi.outputs) {
      // Find the input to pair with the output.
      const input = WebMidi.inputs.find(
        input => removeInOutFromName(input.name) === removeInOutFromName(output.name)
      );

      if (!input) return;

      const device_raw_name = removeInOutFromName(output.name);
      let device_name = device_raw_name;

      /** Whether the device already in the store or not. */
      const alreadyInStore = devices.find(device => device.raw_name === device_raw_name);

      /** When the device is already in the store, skip to the next one. */
      if (alreadyInStore) continue;

      // When new devices are connected, give them some time to boot before sending version query.
      await new Promise<void>((res) => setTimeout(() => res(), 50));

      // Guess the type of the device.
      const type = await guessDeviceType(output, input);
      const device_guessed_type = type;
      let device_type = device_guessed_type;

      const device_profile = profiles.find(profile => profile.raw_name === device_raw_name);
      if (device_profile) {
        log("profile", "found the profile for", device_raw_name);
        if (device_profile.name) device_name = device_profile.name;
        if (device_profile.type) device_type = device_profile.type;
      }

      const device: ConnectedDeviceData = {
        guessed_type: device_guessed_type,
        type: device_type,

        raw_name: device_raw_name,
        name: device_name,

        input, output
      };

      console.info(`[webmidi]: adding ${device.name} to the store...`);
      setWebMidiDevices(prev => [...prev, device]);
    }
  }
  /** Check for disconnected devices. */
  else {
    const filteredDevices = [...devices].filter(device => {
      const isStillConnected = WebMidi.outputs.find(
        output => output.id === device.output.id)
      && WebMidi.inputs.find(
        input => input.id === device.input.id
      );

      if (!isStillConnected)
        console.info(`[webmidi]: removing ${device.name} from the store...`);
      return isStillConnected;
    });

    setWebMidiDevices([...filteredDevices]);
  }
};

/**
 * Should be executed when the app is mounted, see `src/main.tsx`.
 * Returns a `Promise<boolean>`, so if we can't setup an instance,
 * we restrict some features that requires webmidi.
 *
 * This enables WebMidi but also stores the devices profiles and
 * checks for already connected devices.
 */
export const enableAndSetup = async () => {
  try {
    const midi = await WebMidi.enable({ sysex: true });
    console.info("[webmidi]: successfully enabled");

    // Refresh the devices store with already connected devices.
    checkWebMidiDevices();

    let connect_event_timeout: NodeJS.Timeout | undefined;
    midi.addListener("connected", () => {
      clearTimeout(connect_event_timeout);

      // Check the devices only after all the devices have been connected.
      connect_event_timeout = setTimeout(checkWebMidiDevices, 100);
    });

    let disconnect_event_timeout: NodeJS.Timeout | undefined;
    midi.addListener("disconnected", () => {
      clearTimeout(disconnect_event_timeout);

      // Check the devices only after all the devices have been disconnected.
      disconnect_event_timeout = setTimeout(() => checkWebMidiDevices(false), 100);
    });

    setWebMidiInformations({ isEnabled: true, wasRequested: true });
    return true;
  }
  catch (error) {
    console.error("[webmidi]:", error);
    setWebMidiInformations({ isEnabled: false, wasRequested: true });
    return false;
  }
};
