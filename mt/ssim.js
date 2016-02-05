
        var blurRadius = 10;

        function displayChange(button) {
          if (button.value == "display video") {
            document.getElementById("display").style.display = "block";
            button.value = "hide video";
          } else {
            document.getElementById("display").style.display = "none";
            button.value = "display video";
          }

        }

        var doVertical = true;
        var doBlur = true;
        var checkThq = true;
        var downSampleAlpha = 0.2;

        //fix the canvas value
        var canvasWidth = 300;
        var canvasHeight = 220;
        //set up width & height of video
        var width = canvasWidth;
        // var height = Math.round(videoHeight * 0.7);
        var height = canvasHeight;

        var startYposition = canvasHeight - height;

        //initialize the canvas
        var video = document.getElementById("vid");
        // var canvas = document.createElement('canvas');
        //FIXME for testing purpose
        var canvas = document.getElementById("rawcanvas");

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        //get the context
        var context = canvas.getContext('2d');
        var localMediaStream = null;
        var fArray = [];
        var SIArray = [];
        var TIArray = [];
        var SSIMArray = [];

        var lastAvgSI;
        var lastAvgTI;
        var lastAvgSSIM;


        // var videoIndex = 1;
        // var cameraView = window.olpener.cameraView;
        
        var dataSession;

        var c1 = 0.1;
        var c2 = 0.1;

        //For Default Value
        var defaultThArray = [];
        defaultThArray[0] = {};
        //0 - 1
        defaultThArray[0].thq = 0.001;
        defaultThArray[0].ths = 50;
        defaultThArray[0].tht = 70;

        var currTh = {};
        //for current values
        currTh.thq = defaultThArray[0].thq;
        currTh.ths = defaultThArray[0].ths;
        currTh.tht = defaultThArray[0].tht;


        var currentMode = "default";
        var currentSpeed = 0;
        var preSpeed = currentSpeed;
        var currSpeedIndex = 0;
        var priorityOn = false;
        var priorityCheck;
        var mtOn = false;
        // updateInfo();

        //Image Process Logic
        Filters = {};
        if (!window.Float32Array)
          Float32Array = Array;

        Filters.mySobel = function(greyMatrix) {
          var w = width;
          var h = height;    
          console.time("sobel");                  
          var myout = new Float32Array((w - 1) * (h - 1));
          for (var y=1; y<h-1; y++) {
            for (var x=1; x<w-1; x++) {
              var loc = y*w+x;
              //horizontal
              var rH = 
                greyMatrix[loc - w + 1]
              - greyMatrix[loc - w  - 1]
              + (greyMatrix[loc + 1] << 1)
              - (greyMatrix[loc - 1] << 1)
              + greyMatrix[loc + w  + 1]
              - greyMatrix[loc + w  - 1];
              //vertical
              var rV = 0;
              if (doVertical) {
                rV = 
                - greyMatrix[loc - w - 1]
                - (greyMatrix[loc - w ] << 1)
                - greyMatrix[loc - w + 1]
                + greyMatrix[loc + w - 1]
                + (greyMatrix[loc + w ] << 1)
                + greyMatrix[loc + w + 1];
              }

              myout[(y-1)*w +(x-1)] = Math.sqrt(rV*rV + rH*rH);
            }
          }
          console.timeEnd("sobel");           
          return myout;
        };


        var constraints;

        var onCameraFail = function (e) {
            console.log('Camera did not work.', e);
        };


        constraints = {
          audio: false,
          video: true
        };
        // console.log("my opener deviceId is yoyoyo " + window.opener.deviceId);

        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        window.URL = window.URL || window.webkitURL;
        
        getMedia();

        function getMedia() {
          navigator.getUserMedia(constraints, function (stream) {
              video.src = window.URL.createObjectURL(stream);
              localMediaStream = stream;
              setTimeout(function(){mtOn = true;}, 3000);

              setInterval(function() {
                  console.time("SSIM");
                  //get the last frame
                  var preFrame = fArray[fArray.length  - 1];

                  //dequeue the first element
                  if (fArray.length == 10) {
                    // fArray.shift();
                    fArray.shift();
                  } 
                    
                  var frame = getFrame();

                  if (SIArray.length == 10) {
                    SIArray.shift();
                  }
                  if (TIArray.length == 10) {
                    TIArray.shift();
                  }
                  if (SSIMArray.length == 10) {
                    SSIMArray.shift();
                  }

                  fArray.push(frame);

                  var SI = getSI(frame);
                  SIArray.push(SI);

                  var TI = getTI(preFrame, frame);              
                  TIArray.push(TI);

                  var SSIM = getSSIM(preFrame, frame);    
                  SSIMArray.push(SSIM);

                  //Iteractive Algorithm
                  //get the current average value
                  var avgSI = getMean(SIArray);
                  var avgTI = getMean(TIArray);
                  var avgSSIM = getMean(SSIMArray);


                  var deltaAvgSI = (Math.abs(avgSI - lastAvgSI));
                  var deltaAvgTI = (Math.abs(avgTI - lastAvgTI));
                  var deltaAvgSSIM = (Math.abs(avgSSIM - lastAvgSSIM));

                  // ss[2]fo(deltaAvgTI);
                  if (checkThq && (deltaAvgSSIM <= currTh.thq)) {
                    console.log("skip        skip");
                    // skipt this frame
                  } else {
                    if ((deltaAvgSI < currTh.ths) && (deltaAvgTI < currTh.tht)) {
                      // var D = 0;
                      console.log("deltaAvgSI or deltaAvgTI smaller than threshold");
                    } else {
                      if (mtOn) {
                        if (!priorityOn) {
                          console.log("ononononononononononononononononononononononononononononononononononon");
                          // signaling(deltaAvgTI);
                          document.getElementById("myWebRTC").style.boxShadow = "0px 0px 20px red";

                          priorityOn = true;
                          priorityCheck = setTimeout(function() {
                            priorityOn = false;
                            document.getElementById("myWebRTC").style.boxShadow = null;
                          }, 2000);
                        } else {
                          console.log("waitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwaitwait")
                        }
                      } else {
                        console.log("mt mode off");
                      }
                    }
                  } 
                  console.log("Frame Information:");
                  console.log("current threshold for SSIM(thq) is " + currTh.thq);
                  console.log("current threshold for avgTI(tht) is " + currTh.tht);
                  console.log("current threshold for avgSI(ths) is " + currTh.ths);
                  console.log("delta AvgSSIM is " + deltaAvgSSIM);
                  console.log("delta avgTI is " + deltaAvgTI);
                  console.log("delta avgSI is " + deltaAvgSI);
                  console.log("box radius is " + blurRadius);

                  lastAvgSI = avgSI;
                  lastAvgTI = avgTI;
                  lastAvgSSIM = avgSSIM;
                  console.timeEnd("SSIM");
              }, 100);
          }, onCameraFail);
        };

        function getFrame() {
            context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
            var imgDataNormal = context.getImageData(0, startYposition, width, height);
            
            // testContext.putImageData(imgDataNormal, 0, 0);
            console.time("grey");           
            var img_u8 = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
            jsfeat.imgproc.grayscale(imgDataNormal.data, width, height, img_u8);



            console.timeEnd("grey");           
            // if (!doBlur) {
            //   console.time("blur");           
            //   jsfeat.imgproc.box_blur_gray(img_u8, img_u8, blurRadius, 0);
            //   console.timeEnd("blur");           
            // }
            var temp = img_u8.data;
            var greycanvas = document.getElementById("greycanvas");
            greycanvas.width = width;
            greycanvas.height = height;
            var greyCtx = greycanvas.getContext('2d');
            var imageData = greyCtx.createImageData(width, height);

            var data_u32View = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = width * height;
            while (--i >= 0) {
              var pix = temp[i];
              data_u32View[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }
            greyCtx.putImageData(imageData, 0, 0);


            return img_u8.data;
        }

        function getTI(previous, current) {
            var temp = new Float32Array(width*height);
            var len = current.length;
            for (var i = 0; i < len; i++) {
                temp[i] = (current[i] - previous[i]);
            }
            return getVarianceWOavg(temp);
        }

        function getSI(current) {
            var temp = Filters.mySobel(current);
            // var temp = current;
            //FIXME for testing purpose
            var blurcanvas = document.getElementById("blurcanvas");
            blurcanvas.width = width;
            blurcanvas.height = height;
            var blurCtx = blurcanvas.getContext('2d');
            var imageData = blurCtx.createImageData(width, height);

            var data_u32View = new Uint32Array(imageData.data.buffer);
            var alpha = (0xff << 24);
            var i = width * height;
            while (--i >= 0) {
              var pix = temp[i];
              data_u32View[i] = alpha | (pix << 16) | (pix << 8) | pix;
            }
            blurCtx.putImageData(imageData, 0, 0);

            return getVarianceWOavg(temp);
        }

        function getSSIM(previous, current) {
          var preMean = getMean(previous);
          var curMean = getMean(current);

          var preVar = getVariance(previous, preMean);
          var curVar = getVariance(current, curMean);

          var numerator = (((preMean*curMean) << 1) + c1)
          *((getConvariance(previous, current, preMean, curMean) << 1) + c2);

          var denominator = ((curMean * curMean) + (preMean * preMean) + c1)
          *(curVar + preVar + c2);

          return (numerator/denominator);
        }

        function getVariance(input, avg) {
            var temp = 0;
            var len = input.length;
            for (var i = 0; i < len; i++) {
                temp += ((input[i] - avg) * (input[i] - avg)); 
            }
            return temp/len;
        }

        function getVarianceWOavg(input) {
            var avg = getMean(input);
            var temp = 0;
            var len = input.length;
            for (var i = 0; i < len; i++) {
                temp += ((input[i] - avg) * (input[i] - avg)); 
            }
            return temp/len;
        }

        function getConvariance(input1, input2, avg1, avg2) {
          var temp = 0;
          var len = input1.length;
          for (var i = 0; i < len; i++) {
            temp += ((input1[i] - avg1) * (input2[i] - avg2));
          }
          return temp/len;
        }


        function getMean(input) {
          var len = input.length;
          var sum = 0;
          for (var i = 0; i < len; i++) {
            sum+=input[i];
          }
          return sum/len;
        }



            //current value
            // document.getElementById("thq").innerHTML= currTh.thq;
            // document.getElementById("ths").innerHTML= currTh.ths;
            // document.getElementById("tht").innerHTML= currTh.tht;
     

