// HomeScreen.jsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import ItemList from "../components/ItemList";
import { getItems, createItem, updateItem, deleteItem } from "../services/api";

export default function HomeScreen({ route, navigation }) {
    console.log("Parâmetros da rota:", route.params);
    
    // Verificação segura do token
    const token = route.params?.token;
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);

    // Redirecionar se não tiver token
    useEffect(() => {
        if (!token) {
            Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
            navigation.navigate("Login");
            return;
        }
    }, [token, navigation]);

    useEffect(() => {
        const fetchItems = async () => {
            if (!token) return;
            
            setLoading(true);
            try {
                console.log("Buscando itens com token:", token);
                const data = await getItems(token);
                console.log("Itens recebidos:", data);
                setItems(data || []);
            } catch (error) {
                console.error("Erro ao carregar itens:", error);
                Alert.alert("Erro", "Não foi possível carregar os itens.");
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [token]);

    const handleCreateItem = useCallback(async () => {
        if (!newItemName.trim()) {
            Alert.alert("Atenção", "O nome do item não pode ser vazio.");
            return;
        }
        
        setLoading(true);
        try {
            const newItem = await createItem(newItemName.trim(), token);
            setItems((prev) => [...prev, newItem]);
            setNewItemName("");
            Alert.alert("Sucesso", "Item criado com sucesso!");
        } catch (error) {
            console.error("Erro ao criar item:", error);
            Alert.alert("Erro", "Não foi possível criar o item.");
        } finally {
            setLoading(false);
        }
    }, [newItemName, token]);

    const handleUpdateItem = useCallback(async () => {
        if (!editingItem || !newItemName.trim()) {
            Alert.alert("Atenção", "O nome do item não pode ser vazio.");
            return;
        }
        
        setLoading(true);
        try {
            const updatedItem = await updateItem(editingItem.id, newItemName.trim(), token);
            setItems((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
            setEditingItem(null);
            setNewItemName("");
            Alert.alert("Sucesso", "Item atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            Alert.alert("Erro", "Não foi possível atualizar o item.");
        } finally {
            setLoading(false);
        }
    }, [editingItem, newItemName, token]);

    const handleDeleteItem = useCallback(async (id) => {
        Alert.alert(
            "Confirmar",
            "Tem certeza que deseja excluir este item?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteItem(id, token);
                            setItems((prev) => prev.filter((item) => item.id !== id));
                            Alert.alert("Sucesso", "Item excluído com sucesso!");
                        } catch (error) {
                            console.error("Erro ao excluir item:", error);
                            Alert.alert("Erro", "Não foi possível excluir o item.");
                        }
                    }
                }
            ]
        );
    }, [token]);

    const handleEditItem = (item) => {
        setEditingItem(item);
        setNewItemName(item.name);
    };

    const handleLogout = () => {
        Alert.alert(
            "Sair",
            "Deseja realmente sair?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Sair", 
                    style: "destructive",
                    onPress: () => navigation.navigate("Login")
                }
            ]
        );
    };

    if (!token) {
        return (
            <View style={styles.container}>
                <Text>Redirecionando para login...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lista de Itens</Text>
            
            {loading && <ActivityIndicator size="large" color="#6200EE" />}
            
            <ItemList 
                items={items} 
                onEdit={handleEditItem} 
                onDelete={handleDeleteItem} 
                loading={loading}
            />
            
            <TextInput
                style={styles.input}
                placeholder={editingItem ? "Editar nome do item" : "Nome do novo item"}
                value={newItemName}
                onChangeText={setNewItemName}
                editable={!loading}
            />
            
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={editingItem ? handleUpdateItem : handleCreateItem}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {editingItem ? "Atualizar Item" : "Criar Item"}
                </Text>
            </TouchableOpacity>
            
            {editingItem && (
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                        setEditingItem(null);
                        setNewItemName("");
                    }}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Cancelar Edição</Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Sair</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F5F5F5",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#333",
        textAlign: "center",
    },
    input: {
        height: 50,
        borderColor: "#DDD",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: "#FFF",
        marginBottom: 15,
    },
    button: {
        backgroundColor: "#6200EE",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },
    buttonDisabled: {
        backgroundColor: "#CCCCCC",
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    cancelButton: {
        backgroundColor: "#FF9800",
    },
    logoutButton: {
        backgroundColor: "#B00020",
    },
});