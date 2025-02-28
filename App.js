import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Vibration } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';

const shiftTimes = {
  'Shift 1': ['07:45 AM', '09:45 AM'],
  'Shift 2': ['03:45 PM', '07:45 PM'],
  'Shift 3': ['01:45 AM', '03:45 AM'],
};

export default function App() {
  const [mode, setMode] = useState('Manual');
  const [shift, setShift] = useState('Shift 1');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('30');
  const [ampm, setAmPm] = useState('AM');
  const [countdown, setCountdown] = useState(null);
  const [sound, setSound] = useState(null);
  const [currentShiftIndex, setCurrentShiftIndex] = useState(0);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(true); // Vibration toggle state
  const [displayedAlarmTime, setDisplayedAlarmTime] = useState(''); // Stores the displayed alarm time

  const generateNumbers = (min, max) =>
    Array.from({ length: max - min + 1 }, (_, i) => (min + i).toString().padStart(2, '0'));

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(new Date().setHours(hours, minutes, 0, 0));
  };

  const startCountdown = () => {
    let nextAlarm;
    if (mode === 'Shift') {
      const timesToCheck = shiftTimes[shift].map(parseTime);
      const now = new Date();
      nextAlarm = timesToCheck.find((t) => t > now) || timesToCheck[0];
      if (nextAlarm <= now) nextAlarm.setDate(nextAlarm.getDate() + 1);
      setCountdown(nextAlarm - now);
      setCurrentShiftIndex(timesToCheck.indexOf(nextAlarm));
  
      // Update displayed alarm time
      setDisplayedAlarmTime(shiftTimes[shift][timesToCheck.indexOf(nextAlarm)]);
    } else {
      nextAlarm = parseTime(`${hour}:${minute} ${ampm}`);
      const now = new Date();
      if (nextAlarm <= now) nextAlarm.setDate(nextAlarm.getDate() + 1);
      setCountdown(nextAlarm - now);
  
      // Update displayed alarm time
      setDisplayedAlarmTime(`${hour}:${minute} ${ampm}`);
    }
  };
  
  useEffect(() => {
    if (countdown === null) return;
    const interval = setInterval(() => {
      if (countdown <= 1000) {
        clearInterval(interval);
        triggerAlarm();
      } else {
        setCountdown((prev) => prev - 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const triggerAlarm = async () => {
    try {
      // Start vibration if enabled
      if (isVibrationEnabled) {
        Vibration.vibrate([1000, 1000, 1000], true); // Vibrate for 1 second, pause for 1 second, repeat
      }

      const { sound } = await Audio.Sound.createAsync(require('./assets/alarm.mp3'), { shouldPlay: true });
      setSound(sound);
      await sound.playAsync();

      setTimeout(() => {
        sound.stopAsync();
        setSound(null);
        if (isVibrationEnabled) {
          Vibration.cancel(); // Stop vibration after 30 seconds
        }
        if (mode === 'Shift') {
          const timesToCheck = shiftTimes[shift].map(parseTime);
          const nextIndex = (currentShiftIndex + 1) % timesToCheck.length;
          const nextAlarm = timesToCheck[nextIndex];
          const now = new Date();
          if (nextAlarm <= now) nextAlarm.setDate(nextAlarm.getDate() + 1);
          setCountdown(nextAlarm - now);
          setCurrentShiftIndex(nextIndex);
        
          // Update displayed alarm time for the next shift
          setDisplayedAlarmTime(shiftTimes[shift][nextIndex]);
        }        
      }, 30000); // Stop alarm and vibration after 30 seconds
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wellness Alarm App</Text>
      <View style={styles.alarmSelector}>
        <Picker selectedValue={mode} onValueChange={setMode} style={styles.pickerSelector}>
          <Picker.Item label="Manual Mode" value="Manual" />
          <Picker.Item label="Shift Mode" value="Shift" />
        </Picker>
      </View>

      {mode === 'Shift' ? (
        <View style={styles.shiftContainer}>
          <Picker selectedValue={shift} onValueChange={setShift} style={styles.pickerShift}>
            {Object.keys(shiftTimes).map((s) => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        </View>
      ) : (
        <View style={styles.manualContainer}>
          <Picker selectedValue={hour} onValueChange={setHour} style={styles.picker}>
            {generateNumbers(1, 12).map((num) => (
              <Picker.Item key={num} label={num} value={num} />
            ))}
          </Picker>
          <Text style={styles.colon}>:</Text>
          <Picker selectedValue={minute} onValueChange={setMinute} style={styles.picker}>
            {generateNumbers(0, 59).map((num) => (
              <Picker.Item key={num} label={num} value={num} />
            ))}
          </Picker>
          <Picker selectedValue={ampm} onValueChange={setAmPm} style={styles.picker}>
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      )}

      <View style={styles.vibrationToggle}>
        <Text style={styles.toggleText}>Vibration</Text>
        <Switch
          value={isVibrationEnabled}
          onValueChange={(value) => setIsVibrationEnabled(value)}
        />
      </View>

      <TouchableOpacity style={styles.alarmButton} onPress={startCountdown}>
  <Text style={styles.buttonText}>Set Alarm</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.testButton} onPress={triggerAlarm}>
  <Text style={styles.buttonText}>Test Alarm</Text>
</TouchableOpacity>

{displayedAlarmTime && (
  <Text style={styles.alarmText}>Next Alarm: {displayedAlarmTime}</Text>
)}

{countdown !== null && (
  <Text style={styles.countdown}>
    Alarm in: {Math.floor(countdown / 3600000)}h {Math.floor((countdown % 3600000) / 60000)}m {' '}
    {Math.floor((countdown % 60000) / 1000)}s
  </Text>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  manualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  alarmText: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#FFF',
  marginBottom: 10,
},
  alarmSelector: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  shiftContainer: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  pickerSelector: {
    width: 200,
    height: 50,
    color: '#000',
  },
  picker: {
    width: 110,
    height: 50,
    color: '#000',
  },
  pickerShift: {
    width: 130,
    height: 50,
    color: '#000',
  },
  colon: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 5,
  },
  vibrationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  alarmButton: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  testButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  countdown: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
  },
});