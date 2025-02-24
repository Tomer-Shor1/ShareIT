import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DatabaseManager } from '../Model/databaseManager';
import { Reader } from '../ViewModel/Reader';

const BuyCoinsPage = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [coinAmount, setCoinAmount] = useState('');
  const [creditCardNumber, setCreditCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleBuyCoins = async () => {
    setErrorMessage('');
    
    // בדיקת קלט: סכום להוספה
    const amount = parseFloat(coinAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('נא להזין סכום חוקי.');
      return;
    }
    
    // בדיקת קלט: מספר כרטיס אשראי - 16 ספרות
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(creditCardNumber)) {
      setErrorMessage('נא להזין מספר כרטיס תקין (16 ספרות).');
      return;
    }
    
    // בדיקת קלט: קוד כרטיס (CVV) - 3 ספרות
    const cvvRegex = /^\d{3}$/;
    if (!cvvRegex.test(cvv)) {
      setErrorMessage('נא להזין קוד כרטיס תקין (3 ספרות).');
      return;
    }
    
    // בדיקת קלט: תוקף הכרטיס בפורמט MM/YY
    const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expRegex.test(expirationDate)) {
      setErrorMessage('נא להזין תוקף תקין (MM/YY).');
      return;
    }
    
    // בדיקת קלט: מספר תעודת זהות - נניח 9 ספרות
    const idRegex = /^\d{9}$/;
    if (!idRegex.test(idNumber)) {
      setErrorMessage('נא להזין מספר תעודת זהות תקין (9 ספרות).');
      return;
    }
    
    try {
      setLoading(true);
      const user = await Reader.getCurrentUser();
      if (!user) {
        setErrorMessage('יש להתחבר כדי לבצע רכישה.');
        return;
      }
      const userId = user.uid;
      await DatabaseManager.addCoinsToUser(userId, amount);
      Alert.alert("הצלחה", "המטבעות נוספו בהצלחה לחשבונך.");
      // איפוס השדות
      setCoinAmount('');
      setCreditCardNumber('');
      setCvv('');
      setExpirationDate('');
      setIdNumber('');
    } catch (error) {
      console.error("Error adding coins:", error);
      setErrorMessage("אירעה שגיאה, נא לנסות שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        {/* כפתור חזרה ל־Main */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerText}>רכישת מטבעות</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.label}>סכום להוספה:</Text>
        <TextInput
          style={styles.input}
          value={coinAmount}
          onChangeText={setCoinAmount}
          keyboardType="numeric"
          placeholder="למשל, 50"
        />
        <Text style={styles.label}>מספר כרטיס אשראי:</Text>
        <TextInput
          style={styles.input}
          value={creditCardNumber}
          onChangeText={setCreditCardNumber}
          keyboardType="numeric"
          placeholder="16 ספרות"
          maxLength={16}
        />
        <Text style={styles.label}>קוד כרטיס (CVV):</Text>
        <TextInput
          style={styles.input}
          value={cvv}
          onChangeText={setCvv}
          keyboardType="numeric"
          placeholder="3 ספרות"
          maxLength={3}
          secureTextEntry
        />
        <Text style={styles.label}>תוקף (MM/YY):</Text>
        <TextInput
          style={styles.input}
          value={expirationDate}
          onChangeText={setExpirationDate}
          keyboardType="numeric"
          placeholder="MM/YY"
          maxLength={5}
        />
        <Text style={styles.label}>מספר תעודת זהות:</Text>
        <TextInput
          style={styles.input}
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
          placeholder="9 ספרות"
          maxLength={9}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleBuyCoins}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>אשר תשלום והוסף מטבעות</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.noteText}>כל מטבע עולה 1 שקל חדש</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 10,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  noteText: {
    marginTop: 15,
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
});

export default BuyCoinsPage;
