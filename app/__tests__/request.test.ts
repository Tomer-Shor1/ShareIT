// Test open request 

import { DatabaseManager } from '../Model/databaseManager';
import { doc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

describe('DatabaseManager Integration Tests', () => {
  let dbManager: DatabaseManager;
  let testDocId: string = "";

  beforeAll(async () => {
    // Sign in with a test user. Make sure this user exists in your Firebase project.
    dbManager = DatabaseManager.getInstance();

    const auth = getAuth();
    await signInWithEmailAndPassword(auth, 'test@test.com', 'Test11!');
    console.log("OZATARHOMO");


    console.log("DatabaseManager instance initialized!!!.");
    

  });

  beforeEach(async () => {
    // Clean up any existing test data in the 'Open-Requests' collection.
    const db = DatabaseManager.getDB();
    const requestsCollection = collection(db, 'Open-Requests');
    const snapshot = await getDocs(requestsCollection);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  });

  afterEach(async () => {
    // Clean up the test document if it was created.
    if (testDocId) {
      try {
        await deleteDoc(doc(DatabaseManager.getDB(), 'Open-Requests', testDocId));
        console.log(`Deleted test document with ID: ${testDocId}`);
      } catch (error) {
        console.error("Error cleaning up test document:", error);
      }
      testDocId = "";
    }
  });

  test('should add a document and retrieve it from Firestore', async () => {
    // Test data: adjust fields as needed.
    const testData = {
      title: 'Integration Test Request',
      currentCoordinates: '32.0853,34.7818', // Example coordinates for Tel Aviv
      currentAddress: 'Test Address',
      DestinationLoaction: 'Test Destination',
      additionalNotes: 'This is a test request',
      phoneNumber: '123456789',
      status: "pending",
      uid: 'testuser@example.com', // or 'test-user-id' if that's your UID
    };

    // Call addDocument to add a new request.
    //testDocId = await DatabaseManager.addDocument('Open-Requests', testData);
    expect(testDocId).toBeTruthy();

    // Retrieve the document using its ID.
    const retrievedRequest = await DatabaseManager.getRequestById(testDocId);
    expect(retrievedRequest).toBeTruthy();
    expect(retrievedRequest.title).toBe(testData.title);
    expect(retrievedRequest.currentAddress).toBe(testData.currentAddress);
    expect(retrievedRequest.DestinationLoaction).toBe(testData.DestinationLoaction);
    expect(retrievedRequest.additionalNotes).toBe(testData.additionalNotes);
    expect(retrievedRequest.phoneNumber).toBe(testData.phoneNumber);
    expect(retrievedRequest.status).toBe("pending");
    // Optionally verify timestamps exist.
    expect(retrievedRequest.createdAt).toBeTruthy();
    expect(retrievedRequest.updatedAt).toBeTruthy();
  });
});