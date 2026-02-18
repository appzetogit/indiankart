import { useState, useCallback } from 'react';

export const useAddressAutocomplete = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSuggestions = useCallback((input) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error('Google Maps API not loaded');
            return;
        }

        const service = new window.google.maps.places.AutocompleteService();
        setLoading(true);

        service.getPlacePredictions({
            input,
            componentRestrictions: { country: 'in' },
            types: ['geocode', 'establishment']
        }, (predictions, status) => {
            setLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSuggestions(predictions);
            } else {
                setSuggestions([]);
            }
        });
    }, []);

    const fetchPlaceDetails = useCallback((placeId) => {
        return new Promise((resolve) => {
            if (!placeId || !window.google || !window.google.maps || !window.google.maps.places) {
                resolve(null);
                return;
            }

            // PlacesService requires an HTML element to be initialized, 
            // even if we're not displaying anything. We use a dummy div.
            const dummyDiv = document.createElement('div');
            const service = new window.google.maps.places.PlacesService(dummyDiv);

            service.getDetails({
                placeId,
                fields: ['address_components', 'formatted_address']
            }, (result, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                    const components = result.address_components;
                    let city = '';
                    let state = '';
                    let pincode = '';
                    let area = '';

                    components.forEach(component => {
                        const types = component.types;
                        if (types.includes('locality')) {
                            city = component.long_name;
                        } else if (types.includes('administrative_area_level_2') && !city) {
                            city = component.long_name;
                        }
                        
                        if (types.includes('administrative_area_level_1')) {
                            state = component.long_name;
                        }
                        if (types.includes('postal_code')) {
                            pincode = component.long_name;
                        }
                        if (types.includes('sublocality') || types.includes('neighborhood') || types.includes('route')) {
                            area = area ? `${area}, ${component.long_name}` : component.long_name;
                        }
                    });

                    resolve({
                        address: result.formatted_address,
                        city,
                        state,
                        pincode,
                        area
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }, []);

    return {
        suggestions,
        loading,
        fetchSuggestions,
        fetchPlaceDetails,
        setSuggestions
    };
};
