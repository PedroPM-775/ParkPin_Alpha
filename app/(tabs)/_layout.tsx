// Importación de librerías y componentes necesarios
import { Entypo, MaterialIcons } from '@expo/vector-icons'; // Iconos
import AsyncStorage from '@react-native-async-storage/async-storage'; // Almacenamiento persistente
import * as Location from 'expo-location'; // API de ubicación
import React, { useEffect, useRef, useState } from 'react'; // Hooks de React
import { ActivityIndicator, Alert, Animated, Dimensions, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Componentes básicos de React Native
import MapView, { Marker, Region } from 'react-native-maps'; // Mapa y marcador

// Obtener dimensiones de pantalla
const { height, width } = Dimensions.get('window');

// Tipo para representar coordenadas geográficas
type Coordinate = {
    latitude: number;
    longitude: number;
};

// Estilo personalizado (oscuro) para el mapa
const midGrayMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3a3a3a' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8f8f8f' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#444' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
];

// Componente principal de la aplicación
export default function App() {
    const [marker, setMarker] = useState<Coordinate | null>(null); // Estado del marcador
    const [loading, setLoading] = useState<boolean>(true); // Estado de carga
    const [menuVisible, setMenuVisible] = useState(false); // Estado del menú lateral
    const slideAnim = useRef(new Animated.Value(width)).current; // Valor de animación para menú
    const mapRef = useRef<MapView>(null); // Referencia al mapa

    // Cargar marcador desde almacenamiento local al iniciar
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

    // Guardar la ubicación actual del usuario como marcador
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

    // Eliminar el marcador y borrarlo del almacenamiento
    const handleRemoveMarker = async () => {
        setMarker(null);
        await AsyncStorage.removeItem('marker');
    };

    // Centrar el mapa en la ubicación actual del usuario
    const centerMapOnUser = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos denegados', 'Se necesita acceso a la ubicación.');
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        mapRef.current?.animateToRegion(coords, 1000);
    };

    // Mostrar el menú lateral con animación
    const openMenu = () => {
        setMenuVisible(true);
        Animated.timing(slideAnim, {
            toValue: width * 0.4,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    // Ocultar el menú lateral con animación
    const closeMenu = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            setMenuVisible(false);
        });
    };

    // Mostrar pantalla de carga mientras se lee el marcador
    if (loading) {
        return (
            <View style={[styles.centered]}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Cargando marcador guardado...</Text>
            </View>
        );
    }

    // Región inicial del mapa (centrada en marcador o Madrid por defecto)
    const initialRegion: Region = {
        latitude: marker?.latitude || 40.4168,
        longitude: marker?.longitude || -3.7038,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    // Render del componente principal
    return (
        <View style={styles.container}>
            {/* Encabezado superior */}
            <View style={styles.header}>
                <Text style={styles.appTitle}>Mi App</Text>
                <TouchableOpacity onPress={openMenu}>
                    <Entypo name="menu" size={28} color="white" />
                </TouchableOpacity>
            </View>

            {/* Contenedor del mapa */}
            <View style={styles.mapContainer}>
                <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} customMapStyle={midGrayMapStyle} showsUserLocation>
                    {marker && <Marker coordinate={marker} />}
                </MapView>

                {/* Botón flotante para centrar el mapa */}
                <TouchableOpacity style={styles.centerButton} onPress={centerMapOnUser}>
                    <MaterialIcons name="my-location" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Botones para guardar o eliminar marcador */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleSetMarker}>
                    <Text style={styles.buttonText}>GUARDAR MI UBICACIÓN</Text>
                </TouchableOpacity>

                {marker && (
                    <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleRemoveMarker}>
                        <Text style={[styles.buttonText, styles.removeButtonText]}>QUITAR MARCADOR</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Menú lateral animado */}
            {menuVisible && (
                <Pressable style={styles.overlay} onPress={closeMenu}>
                    <Animated.View
                        style={[
                            styles.animatedMenu,
                            {
                                left: slideAnim.interpolate({
                                    inputRange: [width * 0.4, width],
                                    outputRange: [width * 0.6, width],
                                    extrapolate: 'clamp',
                                }),
                                width: width * 0.6,
                            },
                        ]}>
                        <Pressable onPress={(e) => e.stopPropagation()} style={styles.menu}>
                            <Text style={styles.menuItem}>📁 Ajustes (próximamente)</Text>
                            <Text style={styles.menuItem}>ℹ️ Acerca de</Text>
                            <Text style={styles.menuItem}>🧪 Función experimental</Text>
                            <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            )}
        </View>
    );
}

// Estilos del componente
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        height: 100,
        paddingHorizontal: 20,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: '#222',
        borderBottomWidth: 1,
    },
    appTitle: {
        color: '#fff',
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    mapContainer: {
        height: height * 0.55,
        borderBottomWidth: 1,
        borderColor: '#222',
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centerButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: '#333',
        borderRadius: 30,
        padding: 12,
        shadowColor: '#fff',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 6,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#000',
    },
    button: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#fff',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    removeButton: {
        backgroundColor: '#b33939',
        shadowColor: '#b33939',
    },
    removeButtonText: {
        color: '#fff',
    },
    centered: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
    },
    animatedMenu: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: '#111',
    },
    menu: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    menuItem: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    closeButton: {
        marginTop: 30,
        paddingVertical: 12,
        backgroundColor: '#333',
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
});
