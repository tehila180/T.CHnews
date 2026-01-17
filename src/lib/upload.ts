import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

export async function uploadImage(uri: string, userId: string) {
  const blob = await uriToBlob(uri);
  const imageRef = ref(storage, `images/${userId}/${Date.now()}`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
}

export async function uploadFile(
  uri: string,
  name: string,
  userId: string
) {
  const blob = await uriToBlob(uri);
  const fileRef = ref(storage, `files/${userId}/${Date.now()}-${name}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}
