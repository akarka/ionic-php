import { Component } from '@angular/core';
import { Camera, CameraDirection, MediaResult } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { LoadingController, Platform } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { finalize } from 'rxjs/operators';


const IMAGE_DIR = 'stored-images';

interface LocalFile {
  name: string;
  path: string,
  data: string
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  images: LocalFile[] = [];

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private loadingCtrl: LoadingController
  ) {
    this.loadFiles();
  }

  async loadFileData(fileNames: string[]) {
    for (let f of fileNames) {
      const filePath = `${IMAGE_DIR}/${f}`;

      const readFile = await Filesystem.readFile({
        directory: Directory.Data,
        path: filePath
      });

      this.images.push({
        name: f,
        path: filePath,
        data: `data:image/jpeg;base64,${readFile.data}`
      });
    }
  }

  async loadFiles() {
    this.images = [];
    const loading = await this.loadingCtrl.create({
      message: 'Yükleniyor..'
    });
    await loading.present();

    Filesystem.readdir({
      directory: Directory.Data,
      path: IMAGE_DIR
    }).then(
      result => {
        this.loadFileData(result.files.map(f => f.name));
      },
      async err => {
        await Filesystem.mkdir({
          directory: Directory.Data,
          path: IMAGE_DIR
        });
      }
    ).then(() => {
      loading.dismiss();
    })
  }

  async selectImage() {
    const image = await Camera.takePhoto({
      quality: 80,
      cameraDirection: CameraDirection.Rear,
      editable: "no"
    })
    if (image && image.webPath) {
      await this.saveImage(image)
    }
    console.log(image);
  }

  async saveImage(photo: MediaResult) {

    const base64Data = await this.readBase64(photo);
    console.log(base64Data);

    const fileName = new Date().getTime() + '.jpg';
    const savedFile = await Filesystem.writeFile({
      directory: Directory.Data,
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data
    });

    this.loadFiles();

  }

  async readBase64(photo: MediaResult) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.uri
      });
      return file.data;
    }
    else {
      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      return await this.convertBlobtoBase64(blob) as string;
    }
  }

  convertBlobtoBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result)
    };
    reader.readAsDataURL(blob);
  });


  async deleteImage(file: LocalFile) {
    await Filesystem.deleteFile({
      directory: Directory.Data,
      path: file.path
    });
    this.loadFiles();
    console.log('Resim siliniyor:', file.name);
  }

  async startUpload(file: LocalFile) {
    const response = await fetch(file.data);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, file.name);
    this.uploadData(formData);

  }

  async uploadData(formData: FormData) {
    const loading = await this.loadingCtrl.create({
      message: 'Resim yükleniyor...'
    });
    await loading.present();

    const url = 'http://localhost/imageupload/upload.php'

    this.http.post(url, formData).pipe(
      finalize(() => {
        loading.dismiss();
      })
    ).subscribe(res => {
      console.log(res);
    })
  }

}


