import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../lib/design';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: {
    barcode: string;
    brand_name?: string;
    generic_name?: string;
    dosage_form?: string;
    strength?: string;
  }) => void;
}

export default function BarcodeScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // Clean barcode — remove leading zeros for NDC format
      const ndc = data.replace(/^0+/, '');
      const response = await fetch(
        `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${ndc}"&limit=1`
      );

      if (response.ok) {
        const json = await response.json();
        const result = json.results?.[0];
        if (result) {
          const strength = result.active_ingredients
            ?.map((ing: any) => `${ing.name} ${ing.strength}`)
            .join(', ') || '';

          onScanned({
            barcode: data,
            brand_name: result.brand_name || undefined,
            generic_name: result.generic_name || undefined,
            dosage_form: result.dosage_form || undefined,
            strength: strength || undefined,
          });
          onClose();
          return;
        }
      }

      // API returned nothing — pass barcode only
      onScanned({ barcode: data });
      onClose();
    } catch {
      // Network error — pass barcode only
      onScanned({ barcode: data });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setScanned(false);
    setLoading(false);
    onClose();
  }

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.permissionWrap}>
          <Ionicons name="camera-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDesc}>
            Allow camera access to scan medication barcodes
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{
            barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Medication Barcode</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Bottom hint */}
          <View style={styles.bottomBar}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.hint}>Looking up medication...</Text>
              </View>
            ) : (
              <Text style={styles.hint}>
                Point camera at the barcode on the medication package
              </Text>
            )}
            {scanned && !loading && (
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => setScanned(false)}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.rescanText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.base,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scanFrame: {
    width: 260, height: 160, alignSelf: 'center',
    borderWidth: 0, position: 'relative',
  },
  corner: {
    position: 'absolute', width: 30, height: 30,
    borderColor: '#52B788', borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  bottomBar: {
    alignItems: 'center', paddingBottom: 60, paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  hint: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
  },
  rescanText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  permissionWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background, paddingHorizontal: SPACING.xxl, gap: SPACING.md,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  permissionDesc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  permissionBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, height: 50,
    paddingHorizontal: SPACING.xxl, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.base,
  },
  permissionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { marginTop: SPACING.sm },
  cancelBtnText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
});
