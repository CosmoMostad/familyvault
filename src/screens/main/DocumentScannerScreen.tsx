import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Document, RootStackParamList } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, FONTS, SPACING } from '../../lib/design';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DocumentScanner'>;
  route: RouteProp<RootStackParamList, 'DocumentScanner'>;
};

export default function DocumentScannerScreen({ navigation, route }: Props) {
  const { memberId, memberName } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: `Documents · ${memberName}` });
  }, [memberName]);

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [memberId])
  );

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (!error) setDocuments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showAddOptions() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await pickCamera();
          if (buttonIndex === 2) await pickLibrary();
        }
      );
    } else {
      Alert.alert('Add Document', 'Choose a source', [
        { text: 'Take Photo', onPress: pickCamera },
        { text: 'Choose from Library', onPress: pickLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  async function pickCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Access', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  }

  async function pickLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo Library Access', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string) {
    if (!user) return;
    setUploading(true);
    try {
      // Compress image
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Path: user.id first folder (required by storage RLS), then memberId subfolder
      const fileName = `${user.id}/${memberId}/${Date.now()}.jpg`;
      const response = await fetch(compressed.uri);
      const blob = await response.blob();
      // Use new Response(blob).arrayBuffer() — blob.arrayBuffer() is not available in React Native
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('documents').insert({
        member_id: memberId,
        name: `Document ${new Date().toLocaleDateString()}`,
        url: urlData.publicUrl,
        type: 'image',
      });

      if (dbError) throw dbError;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchDocuments();
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: Document) {
    Alert.alert('Delete Document', `Delete "${doc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // Extract storage path from URL
          const urlParts = doc.url.split('/documents/');
          if (urlParts.length > 1) {
            await supabase.storage.from('documents').remove([urlParts[1]]);
          }
          await supabase.from('documents').delete().eq('id', doc.id);
          fetchDocuments();
          setSelectedDoc(null);
        },
      },
    ]);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#00B4A6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.uploadText}>Uploading...</Text>
        </View>
      )}

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={documents.length === 0 ? styles.emptyContainer : styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.docCard} onPress={() => setSelectedDoc(item)}>
            <Image source={{ uri: item.url }} style={styles.docImage} resizeMode="cover" />
            <Text style={styles.docName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.docDate}>{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Documents Yet</Text>
            <Text style={styles.emptyDesc}>
              Scan insurance cards, lab results, prescriptions, and other medical records.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={showAddOptions}>
              <Ionicons name="camera-outline" size={18} color={COLORS.textInverse} />
              <Text style={styles.emptyButtonText}>Add First Document</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {documents.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={showAddOptions}>
          <Ionicons name="camera-outline" size={26} color={COLORS.textInverse} />
        </TouchableOpacity>
      )}

      {/* Document viewer modal */}
      <Modal visible={!!selectedDoc} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDoc && (
              <>
                <Image
                  source={{ uri: selectedDoc.url }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalDocName}>{selectedDoc.name}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalDeleteButton} onPress={() => handleDelete(selectedDoc)}>
                    <Text style={styles.modalDeleteText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedDoc(null)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  uploadOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  listContent: { padding: 12 },
  emptyContainer: { flex: 1 },
  row: { justifyContent: 'space-between', paddingHorizontal: 4 },
  docCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  docImage: { width: '100%', height: 120, backgroundColor: '#F3F4F6' },
  docName: { fontSize: 12, fontWeight: '600', color: '#111827', padding: 8, paddingBottom: 2 },
  docDate: { fontSize: 11, color: '#9CA3AF', paddingHorizontal: 8, paddingBottom: 8 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8,
  },
  emptyButtonText: { color: COLORS.textInverse, fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: { width: '90%', maxHeight: '80%', alignItems: 'center' },
  fullImage: { width: '100%', height: 400, borderRadius: 12 },
  modalDocName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalDeleteButton: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  modalDeleteText: { color: '#FFFFFF', fontWeight: '600' },
  modalCloseButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  modalCloseText: { color: '#FFFFFF', fontWeight: '600' },
});
