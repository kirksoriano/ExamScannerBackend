import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import type { Photo } from '@capacitor/camera';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CropperPage implements OnInit {
  detectedQuadResult:DetectedQuadResultItem|undefined;

  dataURL: string = '';
  viewBox: string = '0 0 1280 720';
  imgWidth: number = 0;
  imgHeight: number = 0;

  points: { x: number, y: number }[] = [];

  constructor(private toastController: ToastController, private router: Router) {
    let license = "t00832gAAAFLnm+ZnlPj+87sBek8VtyO7/LHApZMtBrFkWKyr3d3bXltQ66o0Nhh2brFy7ltxUwu+gwEtOJqYUgEfKeIsVR4UOP5/ZtpQY47pD1BYKts="; //public trial
    DocumentNormalizer.initLicense({license:license});
    DocumentNormalizer.initialize();
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as any;
    this.dataURL = state?.image?.dataUrl || '';
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation) {
      const routeState = navigation.extras.state;
      if (routeState) {
        const image:Photo = routeState['image'];
        if (image.dataUrl) {
          const pThis = this;
          let img = new Image();
          img.onload = function(){
            if (image.dataUrl) {
              pThis.viewBox = "0 0 "+img.naturalWidth+" "+img.naturalHeight;
              pThis.imgWidth = img.naturalWidth;
              pThis.imgHeight = img.naturalHeight;
              pThis.dataURL = image.dataUrl;
              pThis.detect(); // Automatically detect after image loads
            }
          }
          img.src = image.dataUrl;
        }
      }
    }
  }
     
  //The width of the SVG element is adjusted so that its ratio matches the image's ratio.
  getSVGWidth(svgElement:any){
    let imgRatio = this.imgWidth/this.imgHeight;
    let width = svgElement.clientHeight * imgRatio;
    return width;
  }

  async detect(){
    let results = (await DocumentNormalizer.detect({source:this.dataURL})).results;
    if (results.length>0) {
      this.detectedQuadResult = results[0]; // Here, we only use the first detection result
      this.points = this.detectedQuadResult.location.points;
      console.log('Detected Points:', this.points);

    }else {
      this.presentToast(); // Make a toast if there are no documents detected
    }
  } 
  
  async presentToast(){
    const toast = await this.toastController.create({
      message: 'No documents detected.',
      duration: 1500,
      position: 'top'
    });
    await toast.present();
  }

  getPointsData(){
    if (this.detectedQuadResult) {
      let location = this.detectedQuadResult.location;
      let pointsData = location.points[0].x + "," + location.points[0].y + " ";
      pointsData = pointsData + location.points[1].x + "," + location.points[1].y +" ";
      pointsData = pointsData + location.points[2].x + "," + location.points[2].y +" ";
      pointsData = pointsData + location.points[3].x + "," + location.points[3].y;
      return pointsData;
    }
    return "";
  }

  selectedIndex: number = -1;
  usingTouchEvent:boolean = false;
  getRectStrokeWidthgetRectStrokeWidth(i:number){
    let percent = 640/this.imgWidth;
    if (i === this.selectedIndex) {
      return 5/percent;
    }else{
      return 2/percent;
    }
  }
     
  onRectMouseDown(index:number,event:any) {
    if (!this.usingTouchEvent) {
      console.log(event);
      this.selectedIndex = index;
    }
  }
  
  onRectMouseUp(event:any) {
    if (!this.usingTouchEvent) {
      console.log(event);
      this.selectedIndex = -1;
    }
  }
  
  onRectTouchStart(index:number,event:any) {
    this.usingTouchEvent = true; //Touch events are triggered before mouse events. We can use this to prevent executing mouse events.
    console.log(event);
    this.selectedIndex = index;
  }

  getRectSize(){
    let percent = 640/this.imgWidth;
    return 30/percent; //30 works fine when the width is 640. Scale it if the image has a different width
  }

  getRectX(index:number,x:number) {
    return this.getOffsetX(index) + x;
  }
  
  getOffsetX(index:number) {
    let width = this.getRectSize();
    if (index === 0 || index === 3) {
      return - width;
    }
    return 0;
  }
  
  getRectY(index:number,y:number) {
    return this.getOffsetY(index) + y;
  }
  
  getOffsetY(index:number) {
    let height = this.getRectSize();
    if (index === 0 || index === 1) {
      return - height;
    }
    return 0;
  }

  onRectMouseMove(event: MouseEvent) {
    if (!this.usingTouchEvent && this.selectedIndex !== -1) {
      const target = event.target as SVGGraphicsElement;
      const svg = target.ownerSVGElement;
      if (!svg) return;
  
      const rect = svg.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (this.imgWidth / rect.width);
      const y = (event.clientY - rect.top) * (this.imgHeight / rect.height);
  
      this.points[this.selectedIndex] = { x, y };
    }
  }
  
  
  onRectTouchMove(event: TouchEvent) {
    if (this.selectedIndex !== -1) {
      const target = event.target as SVGGraphicsElement;
      const svg = target.ownerSVGElement;
      if (!svg) return;
  
      const rect = svg.getBoundingClientRect();
      const touch = event.touches[0];
      const x = (touch.clientX - rect.left) * (this.imgWidth / rect.width);
      const y = (touch.clientY - rect.top) * (this.imgHeight / rect.height);
  
      this.points[this.selectedIndex] = { x, y };
    }
  }
  

  confirmCrop() {
    const croppedPoints = this.points.map(p => ({ x: p.x, y: p.y }));
    this.router.navigate(['/resultviewer'], {
      state: {
        image: this.dataURL,
        points: croppedPoints,
        width: this.imgWidth,
        height: this.imgHeight
      }
    });
  }
  
}
