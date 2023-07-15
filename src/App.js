import React from 'react';
import './App.css';
import ParticlesBg from 'particles-bg'
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo.js';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import Rank from './Components/Rank/Rank.js';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';
import SignIn from './Components/SignIn/SignIn';
import Register from './Components/Register/Register';

const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the portal under Authentification
  const PAT = '670053011ad04e7986d841ac58859793';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = '25nike';
  const APP_ID = 'Test_smb';
  // Change these to whatever model and image URL you want to use
  //const MODEL_ID = 'general-image-recognition';
  const IMAGE_URL = imageUrl;

  const raw = JSON.stringify({
    "user_app_id": {
      "user_id": USER_ID,
      "app_id": APP_ID
    },
    "inputs": [
      {
        "data": {
          "image": {
            "url": IMAGE_URL
          }
        }
      }
    ]
  });

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Key ' + PAT
    },
    body: raw
  };


  return requestOptions;
}



class App extends React.Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        password: '',
        entries: 0,
        joined: ''
      }
    }
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      entries: data.entries,
      joined: data.joined
    }})
  }

  // componentDidMount(){
  //   fetch('http://localhost:3000')
  //     .then(response => response.json())
  //     .then(data => console.log(data));
  // }

  calculateFaceLocation = (data) => {
      const clarifaiface = data.outputs[0].data.regions[0].region_info.bounding_box;
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      return{
        leftCol: clarifaiface.left_col * width,
        topRow: clarifaiface.top_row * height,
        rightCol: width - (clarifaiface.right_col * width),
        bottomRow: height - (clarifaiface.bottom_row * height),
      }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({ input: event.target.value });
  }

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input }, () => {
      fetch("https://api.clarifai.com/v2/models/face-detection/outputs", returnClarifaiRequestOptions(this.state.input))
      .then(response => response.json())
      .then(response =>{
        if(response){
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: { 'content-Type': 'application/json' },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, {entries:count}))
            })

        }
        this.displayFaceBox(this.calculateFaceLocation(response));
      })
      .catch(error => console.log('error', error));
    });
    
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({ isSignedIn: false })
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route: route });
  }

  render() {
    return (
      <div className="App">
        <ParticlesBg type="square" bg={true} />
        <Navigation onRouteChange={this.onRouteChange} isSignedIn={this.state.isSignedIn}/>
        {this.state.route === 'home' 
          ? <div>
              <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}/>
              <FaceRecognition imageUrl={this.state.imageUrl} box={this.state.box} />
            </div>
          : (
              this.state.route ==='signin'
              ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
              : <Register 
                  loadUser = {this.loadUser}
                  onRouteChange={this.onRouteChange} />
            )         
        }
      </div>
    );
  }
}

export default App;