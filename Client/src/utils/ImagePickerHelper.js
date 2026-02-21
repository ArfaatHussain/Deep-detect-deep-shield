import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-simple-toast';

export const pickImageFromGallery = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Toast.show('We need access to your gallery to select an image.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
    base64: false,
  });

  if (!result.canceled) {
    const image = result.assets[0];
    return {
      uri: image.uri,
      type: 'image/jpeg',
      fileName: 'image.jpg',
    };
  }

  return null;
};
