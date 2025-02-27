import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';

export default function App() {
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('30');
  const [ampm, setAmPm] = useState('AM');
  const [countdown, setCountdown] = useState(null);
  const [sound, setSound] = useState(null);

  const generateNumbers = (min, max) => {
    return Array.from({ length: max - min + 1 }, (_, i) => (min + i).toString().padStart(2, '0'));
  };

  const parseTime = () => {
    let hours = parseInt(hour, 10);
    const minutes = parseInt(minute, 10);
  
    // Convert AM/PM to 24-hour format
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  
    const now = new Date();
    let alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
    // If the selected time is in the past, schedule it for the next day
    if (alarmDate <= now) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }
  
    return alarmDate;
  };
  

  const startCountdown = () => {
    const targetTime = parseTime();
    if (!targetTime) return;
    setCountdown(targetTime - new Date());
  };

  useEffect(() => {
    if (countdown === null) return;

    const interval = setInterval(() => {
      const now = new Date();
      const targetTime = parseTime();
      if (!targetTime) {
        clearInterval(interval);
        setCountdown(null);
        return;
      }

      const timeLeft = targetTime - now;
      if (timeLeft < 1000) {
        clearInterval(interval);
        triggerAlarm();
        setCountdown(null);
      } else {
        setCountdown(timeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const triggerAlarm = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alarm.mp3'),
        { shouldPlay: true }
      );
      setSound(sound);
      await sound.playAsync();

      setTimeout(async () => {
        await sound.stopAsync();
      }, 30000); // Stop the sound after 5 seconds
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Alarm App</Text>

      {/* Always Visible Selected Time */}
      <Text style={styles.selectedTime}>Selected Time: {hour}:{minute} {ampm}</Text>

      {/* Time Picker */}
      <View style={styles.pickerContainer}>
        <Picker selectedValue={hour} onValueChange={setHour} style={styles.picker} itemStyle={styles.pickerItem} mode="dropdown">
          {generateNumbers(1, 12).map((num) => (
            <Picker.Item key={num} label={num} value={num} />
          ))}
        </Picker>

        <Text style={styles.colon}>:</Text>

        <Picker selectedValue={minute} onValueChange={setMinute} style={styles.picker} itemStyle={styles.pickerItem} mode="dropdown">
          {generateNumbers(0, 59).map((num) => (
            <Picker.Item key={num} label={num} value={num} />
          ))}
        </Picker>

        <Picker selectedValue={ampm} onValueChange={setAmPm} style={styles.picker} itemStyle={styles.pickerItem} mode="dropdown">
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>

      {/* Set Alarm Button */}
      <TouchableOpacity style={styles.alarmButton} onPress={startCountdown}>
        <Text style={styles.buttonText}>Set Alarm</Text>
      </TouchableOpacity>

      {/* Test Alarm Button */}
      <TouchableOpacity style={styles.testButton} onPress={triggerAlarm}>
        <Text style={styles.buttonText}>Test Alarm</Text>
      </TouchableOpacity>

      {/* Countdown Display */}
      {countdown !== null && (
        <Text style={styles.countdown}>
          Time Left: {Math.floor(countdown / 3600000)}h {Math.floor((countdown % 3600000) / 60000)}m{' '}
          {Math.floor((countdown % 60000) / 1000)}s
        </Text>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF', // Solid blue background
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 20,
  },
  picker: {
    width: 120,
    height: 80,
    color: '#000',
    backgroundColor: 'transparent',
  },
  pickerItem: {
  fontSize: 30, // Increase font size for larger text
  fontWeight: 'bold',
  height: 80, // Increase height for larger text
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
  selectedTime: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  countdown: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
  },
});