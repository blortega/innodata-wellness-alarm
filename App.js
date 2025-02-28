import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';

const shiftTimes = {
  'Shift 1': ['08:00 AM', '10:00 AM'],
  'Shift 2': ['04:00 PM', '08:00 PM'],
  'Shift 3': ['02:00 AM', '04:00 AM'],
};

export default function App() {
  const [mode, setMode] = useState('Manual');
  const [shift, setShift] = useState('Shift 1');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('30');
  const [ampm, setAmPm] = useState('AM');
  const [countdown, setCountdown] = useState(null);
  const [sound, setSound] = useState(null);

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
    let timesToCheck = mode === 'Shift' ? shiftTimes[shift].map(parseTime) : [parseTime(`${hour}:${minute} ${ampm}`)];
    const now = new Date();
    let nextAlarm = timesToCheck.find((t) => t > now) || timesToCheck[0];
    if (nextAlarm <= now) nextAlarm.setDate(nextAlarm.getDate() + 1);
    setCountdown(nextAlarm - now);
  };

  useEffect(() => {
    if (countdown === null) return;
    const interval = setInterval(() => {
      if (countdown <= 1000) {
        clearInterval(interval);
        triggerAlarm();
        setCountdown(null);
      } else {
        setCountdown((prev) => prev - 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const triggerAlarm = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('./assets/alarm.mp3'), { shouldPlay: true });
      setSound(sound);
      await sound.playAsync();
      setTimeout(() => sound.stopAsync(), 30000);
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

      <TouchableOpacity style={styles.alarmButton} onPress={startCountdown}>
        <Text style={styles.buttonText}>Set Alarm</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.testButton} onPress={triggerAlarm}>
        <Text style={styles.buttonText}>Test Alarm</Text>
      </TouchableOpacity>
      
      {countdown !== null && (
        <Text style={styles.countdown}>
          Time Left: {Math.floor(countdown / 3600000)}h {Math.floor((countdown % 3600000) / 60000)}m {' '}
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