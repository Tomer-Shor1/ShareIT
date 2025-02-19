import firestore, { firebase, FirebaseFirestoreTypes, setDoc,  } from '@react-native-firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { Firestore, DocumentData, doc ,increment, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { User } from '@react-native-google-signin/google-signin'

;
import { getAuth , Auth} from 'firebase/auth';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';


let instance;

/**
 * DatabaseManager Component
 * A utility class for managing Firebase database operations.
 */
export class DatabaseManager {
  private static db;
  private static app;
  private static auth;

  private constructor() {
    console.log("🔥 Initializing DatabaseManager...");

    // Ensure Firebase App is initialized only once
    if (getApps().length === 0) {
      console.log("🚀 Initializing Firebase App...");
      DatabaseManager.app = initializeApp(firebaseConfig);
    } else {
      console.log("✅ Firebase App already initialized.");
      DatabaseManager.app = getApp();
    }

    // Initialize Firestore and Auth
    DatabaseManager.db = getFirestore(DatabaseManager.app);
    
    DatabaseManager.auth = getAuth(DatabaseManager.app);
  }

  // ✅ Singleton instance method
  public static getInstance(): DatabaseManager {
    if (!instance) {
      console.log("🔧 Creating new DatabaseManager instance...");   // debugging 
      instance = new DatabaseManager();
    }
    return instance;
  }

  // ✅ Get Firebase Auth instance safely
  public static getAuthInstance(): Auth {
    if (!DatabaseManager.auth) {
      throw new Error("❌ Firebase Auth is not initialized. Call getInstance() first.");
    }
    return DatabaseManager.auth;
  }


  // ✅ Get Firestore instance safely
  public static getDB(): Firestore {
    if (!DatabaseManager.db) {
      throw new Error("❌ Firestore is not initialized. Call getInstance() first.");
    }
    return DatabaseManager.db;
  }


  // Initialize Firestore
  public static initialize(firebaseConfig: any) {
    if (!this.db) {
      console.log("🔥 Initializing Firestore...");
      DatabaseManager.app = initializeApp(firebaseConfig);
      DatabaseManager.db = getFirestore(DatabaseManager.app);
    } else {
      console.log("✅ Firestore already initialized.");
    }
  }
  

  /**
   * Adds a document to a Firestore collection.
   *
   * @param collection - The name of the Firestore collection
   * @param data - The document data to add
   * @returns A promise resolving with the document reference
   */

  public static async addDocument(
    collectionName: string,
    data: Record<string, any>,
  ): Promise<string> {
    try {
    
      const auth = getAuth();
if (!auth.currentUser) {
  throw new Error('User must be authenticated to perform this action');
}

      console.log(`Attempting to add document to collection: ${collectionName}`);
      console.log(`Attempting to add document to collection: ${collectionName}`);
      console.log('Data to be added:', data);


      // Validate collection name
      if (!collectionName || typeof collectionName !== 'string' || !collectionName.trim()) {
        throw new Error('Collection name must be a non-empty string.');
      }

      // Validate document data
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('Document data must be a non-empty object.');
      }

      // Add Firestore timestamp fields
      const documentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      console.log('Prepared document data with timestamps:', documentData);

      // Add the document to Firestore
      const colRef = collection(this.db, collectionName);
      const docRef = await addDoc(colRef, documentData);

      console.log(`Document successfully added to ${collectionName} with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error: any) {
      console.error('Error adding document:', {
        collectionName,
        data,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      throw new Error(`Failed to add document to "${collectionName}": ${error.message}`);
    }
  }


  /**
   * Queries documents from a Firestore collection.
   *
   * @param collectionName - The name of the Firestore collection
   * @param field - The field to filter by
   * @param operator - The comparison operator (e.g., '==', '<', '>', '>=', 'array-contains', etc.)
   * @param value - The value to compare the field to
   * @returns A promise resolving with the queried documents
   */
  static async queryCollection(
    collectionName: string,
    field?: string,
    operator?: FirebaseFirestoreTypes.WhereFilterOp,
    value?: any
  ): Promise<any[]> {
    try {
      console.log(`Attempting to query ${collectionName}`);
  
      const colRef = collection(this.db, collectionName);
      let q;
  
      if (field && operator && value) {
        // יצירת שאילתה עם תנאי
        q = query(colRef, where(field, operator, value));
        console.log(`Querying ${collectionName} where ${field} ${operator} ${value}`);
      } else {
        // יצירת שאילתה ללא תנאי (כל המסמכים)
        q = query(colRef);
        console.log(`Querying all documents in ${collectionName}`);
      }
  
      const querySnapshot = await getDocs(q);
      console.log('Query executed successfully');
  
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data() as { [key: string]: any },
      }));
  
      console.log(`Retrieved ${documents.length} documents from ${collectionName}`);
      console.log('Documents:', documents);
      return documents;
    } catch (error: any) {
      console.error('Detailed query error:', {
        collectionName,
        field,
        operator,
        value,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      });
      throw new Error(`Failed to query collection: ${error.message}`);
    }
  }
  

  
  static async uploadImageToFirestore(userid: string, base64String: string): Promise<{ success: boolean; data: string }> {
    try {
        console.log('Uploading image to Firestore for user:', userid);

        const documentData = {
            image: base64String, // התמונה ב-Base64
            updatedAt: serverTimestamp(), // עדכון תאריך ושעה
        };

        // הפניה למסמך של המשתמש על פי ה-uid
        const userDocRef = doc(this.db, "users", userid);

        // עדכון המסמך
        await updateDoc(userDocRef, documentData);

        console.log('Image uploaded successfully for user:', userid);
        console.log('Base64 String Length:', base64String.length);

        return {
            success: true,
            data: base64String,
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
  }

  /**
   * Fetches the number of coins a user has from Firestore.
   *
   * @param userId - Optional user ID. If not provided, fetches the currently authenticated user's coins.
   * @returns The number of coins the user has, or null if not found.
   */
  static async getUserCoins(userId?: string): Promise<number | null> {
    try {
      const auth = getAuth();
      const userUID = userId || auth.currentUser?.uid;

      console.log(`Fetching coins for user UID: ${userUID}`);

      if (!userUID) {
        console.error("❌ User is not authenticated");
        return null;
      }

      if (!this.db) {
        throw new Error("❌ Firestore is not initialized. Call DatabaseManager.initialize() first.");
      }


      // ✅ Query Firestore to find the user document by UID field
      const usersRef = collection(this.db, "users");
      const q = query(usersRef, where("uid", "==", userUID)); // 🔥 Match UID field
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error(`❌ User document not found for UID: ${userUID}`);
        return null;
      }

      // ✅ Get the first document (assuming UID is unique)
      const userDoc: DocumentData = querySnapshot.docs[0].data();
      console.log("✅ User document found:", userDoc);

      // ✅ Return the user's coin balance
      return userDoc.coins || 0;
    } catch (error) {
      console.error("❌ Error fetching user coins:", error);
      return null;
    }
  }


    /**
   * Adds coins to a user's account.
   *
   * @param userId - Optional user ID. If not provided, uses the currently authenticated user.
   * @param coinsToAdd - The number of coins to add (default = 1).
   * @returns A promise resolving to the updated number of coins or null if failed.
   */
    static async addCoinsToUser(userId?: string, coinsToAdd: number = 1): Promise<number | null> {
      try {
        const auth = getAuth();
        const userUID = userId || auth.currentUser?.uid;
  
        if (!userUID) {
          console.error("❌ User is not authenticated");
          return null;
        }
  
        // ✅ Ensure Firestore is initialized before querying
        if (!this.db) {
          throw new Error("❌ Firestore is not initialized. Call DatabaseManager.initialize() first.");
        }
  
        // ✅ Query Firestore to find the user document by UID field
        const usersRef = collection(this.db, "users");
        const q = query(usersRef, where("uid", "==", userUID));
        const querySnapshot = await getDocs(q);
  
        if (querySnapshot.empty) {
          console.warn(`❌ User ${userUID} not found.`);
          return null;
        }
  
        // ✅ Get the first document (assuming UID is unique)
        const userDoc = querySnapshot.docs[0];
        const userRef = doc(this.db, "users", userDoc.id);
  
        // ✅ Use Firestore's `increment()` to safely add coins
        await updateDoc(userRef, {
          coins: increment(coinsToAdd),
        });
  
        console.log(`✅ Added ${coinsToAdd} coins to user ${userUID}`);
        return (userDoc.data().coins || 0) + coinsToAdd;
      } catch (error) {
        console.error("❌ Error adding coins:", error);
        return null;
      }
    }


    /**
 * Fetch a request document from the "Open-Requests" collection by requestId.
 * @param requestId - The ID of the request document.
 * @returns The request document data or null if not found.
 */
 static async getRequestById(requestId: string): Promise<any | null> {
  try {
    const docRef = doc(this.db, "Open-Requests", requestId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      console.warn(`⚠️ Request with ID ${requestId} not found.`);
      return null;
    }

    console.log("✅ Request found:", docSnapshot.data());
    return { id: docSnapshot.id, ...docSnapshot.data() };
  } catch (error) {
    console.error("❌ Error fetching request:", error);
    return null;
  }
}

static async  markRequestAsCaught(requestId: string, status: boolean): Promise<void> {
  try {
    // Fetch the request first
    const request = await DatabaseManager.getRequestById(requestId);

    if (!request) {
      console.error(`❌ Cannot mark request ${requestId} as caught: Not found.`);
      return;
    }

    const auth = getAuth();
    const userUID = auth.currentUser?.uid || null;

    if (!userUID) {
      console.error("❌ User is not authenticated");
      return;
    }
    // Reference the document and update the "caught" field
    const docRef = doc(this.db, "Open-Requests", requestId);
    await updateDoc(docRef, { 
                      caught: status,
                      takenBy: status ? userUID : null,
                    });

    console.log(`✅ Request ${requestId} marked as caught.`);
  } catch (error) {
    console.error(`❌ Error updating request ${requestId}:`, error);
  }
}

// fetches all requests that a user has taken on hiself.
static async getRequestsTakenByUser(userId?: string): Promise<any[]> {
  try {
    const auth = getAuth();
    const userUID = userId || auth.currentUser?.uid;

    if (!userUID) {
      console.error("❌ User is not authenticated");
      return [];
    }

    console.log(`📌 Fetching requests taken by user ${userUID}...`);

    // Query Open-Requests collection where takenBy == userUID
    const requestsRef = collection(this.db, "Open-Requests");
    const q = query(requestsRef, where("takenBy", "==", userUID));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`⚠️ No requests found for user ${userUID}`);
      return [];
    }

    // Map through and return the requests
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Found ${requests.length} requests taken by user ${userUID}`);
    return requests;
  } catch (error) {
    console.error("❌ Error fetching requests taken by user:", error);
    return [];
  }
}


static async getRequestsOpenedByUser(userId?: string): Promise<any[]> {
  try {
    const auth = getAuth();
    const userUID = userId || auth.currentUser?.uid;

    if (!userUID) {
      console.error("❌ User is not authenticated");
      return [];
    }

    console.log(`📌 Fetching requests taken by user ${userUID}...`);

    // Query Open-Requests collection where takenBy == userUID
    const requestsRef = collection(this.db, "Open-Requests");
    const q = query(requestsRef, where("uid", "==", userUID));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`⚠️ No requests found for user ${userUID}`);
      return [];
    }

    // Map through and return the requests
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Found ${requests.length} requests taken by user ${userUID}`);
    return requests;
  } catch (error) {
    console.error("❌ Error fetching requests taken by user:", error);
    return [];
  }
}




async getTableEntranceByKey(table_name, entrance_key){
  const docRef = doc(DatabaseManager.db, table_name, entrance_key);
  if (!docRef) {
    console.error(`Document ${entrance_key} not found in ${table_name}`);
    return null;
  }
  return docRef;
}

  /**
   * Fetches all documents from a Firestore collection.
   *
   * @param collectionName - The name of the Firestore collection
   * @returns A promise resolving with the fetched documents
   */
  // public async fetchCollection(collectionName: string): Promise<any[]> {
  //   try {
  //     const colRef = collection(this.db, collectionName);
  //     const snapshot = await getDocs(colRef);
  //     const documents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  //     console.log(`Fetched ${documents.length} documents from ${collectionName}.`);
  //     return documents;
  //   } catch (error) {
  //     console.error('Error fetching collection:', error);
  //     return [];
  //   }
  // }


  /**
   * Updates a document in a Firestore collection.
   *
   * @param collectionName - The name of the Firestore collection
   * @param documentId - The ID of the document to update
   * @param data - The new data to set
   * @returns A promise resolving when the document is updated
   */
  // public async updateDocument(
  //   collectionName: string,
  //   documentId: string,
  //   data: Record<string, any>
  // ): Promise<void> {
  //   try {
  //     const docRef = doc(this.db, collectionName, documentId);
  //     await updateDoc(docRef, data);
  //     console.log(`Document ${documentId} in ${collectionName} updated successfully.`);
  //   } catch (error) {
  //     console.error('Error updating document:', error);
  //   }
  // }

  /**
   * Deletes a document from a Firestore collection.
   *
   * @param collectionName - The name of the Firestore collection
   * @param documentId - The ID of the document to delete
   * @returns A promise resolving when the document is deleted
   */
  // public async deleteDocument(collectionName: string, documentId: string): Promise<void> {
  //   try {
  //     const docRef = doc(this.db, collectionName, documentId);
  //     await deleteDoc(docRef);
  //     console.log(`Document ${documentId} in ${collectionName} deleted successfully.`);
  //   } catch (error) {
  //     console.error('Error deleting document:', error);
  //   }
  // }


// export const addUserToFirestore = async (user) => {
//   try {
//     await addDoc(collection(db, 'users'), {
//       uid: user.uid,
//       username: user.username,
//       email: user.email,
//       displayName: user.displayName || '',
//       createdAt: new Date().toISOString(),
//     });
//   } catch (error) {
//     throw new Error(`Failed to add user to Firestore: ${error.message}`);
//   }
// }

static getTestPrivateDBField() {
  return DatabaseManager.db;
  }

}
