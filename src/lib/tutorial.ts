import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (screen: string) => `wren_tutorial_done_${screen}`;

export async function isTutorialDone(screen: string): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(key(screen));
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markTutorialDone(screen: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(screen), 'true');
  } catch {}
}
