import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

const { height } = Dimensions.get('window');

type Coordinate = {
  latitude: number;
  longitude: number;
};

export default function App() {
  const [marker, setMarker] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar marcador desde AsyncStorage
  useEffect(() => {
    const loadMarker = async () => {
      try {
        const json = await AsyncStorage.getItem('marker');
        if (json) {
          const parsed: Coordinate = JSON.parse(json);
          setMarker(parsed);
        }
      } catch (e) {
        console.log('Error al cargar marcador:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMarker();
  }, []);

  const handleSetMarker = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos denegados', 'Se necesita acceso a la ubicación.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const coords: Coordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setMarker(coords);
    await AsyncStorage.setItem('marker', JSON.stringify(coords));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Cargando marcador guardado...</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: marker?.latitude || 40.4168,
    longitude: marker?.longitude || -3.7038,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
        >
          {marker && <Marker coordinate={marker} />}
        </MapView>
      </View>

      {/* Botón */}
      <View style={styles.buttonContainer}>
        <Button title="Guardar mi ubicación" onPress={handleSetMarker} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.6,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
