export interface RouteConfig {
  name: string;
  component: React.ComponentType<any>;
}
import MainPage from "./MainPage";
import CreateRequestScreen from "./CreateRequestPage"
import LoginPage from "./LoginPage"
import SignUp from "./SignUp"
import ShowRequests from "./ShowRequests";
import HomePage from "./HomePage";
import SubscibePage from "./SubscribeScreen";
import ProfilePage from "./ProfilePage";
import BuyCoinsPage from "./BuyCoinsPage";

//   import {HomePage as MainPage} from "../index";
//   import AboutScreen from "./screens/AboutScreen";
//   import ContactScreen from "./screens/ContactScreen";
export type RootStackParamList = {
  LogIn: undefined; // If no parameters are passed
  Home: undefined;
  SignUp: undefined
  CreateRequest: undefined
  ShowRequest: undefined
  MainPage: undefined
  Subscribe: undefined
  ProfilePage: undefined
  BuyCoinsPage: undefined
  // Add more routes here with their respective parameters
};
export const routes: RouteConfig[] = [
  { name: "Home", component: HomePage },
  { name: "CreateRequest", component: CreateRequestScreen },
  { name: "LogIn", component: LoginPage },
  { name: "SignUp", component: SignUp },
  { name: "ShowRequest", component: ShowRequests },
  { name: "Main", component: MainPage },
  { name: "Subscribe", component: SubscibePage },
  { name: "ProfilePage", component: ProfilePage },
  { name: "BuyCoinsPage", component: BuyCoinsPage }
  // { name: "About", component: AboutScreen },
  // { name: "Contact", component: ContactScreen },
];
