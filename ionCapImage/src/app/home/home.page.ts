import { Component } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { HttpClient } from '@angular/common/http';
import { LoadingController, Platform } from '@ionic/angular';
import { Filesystem, Directory } from '@capacitor/filesystem';


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

}
