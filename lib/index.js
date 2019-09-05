'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const fs = require('fs');
const path = require('path');
var Jimp = require('jimp');

module.exports = {
  provider: 'local-resize',
  name: 'Local upload resize',
  init: (config) => {
    //define variants, props should be defined in plugins/uploads/models/File.settings.json
    var variants = [
      {
        maxSize: 900,
        scaleType: "resize",
        prefix: "large_",
        quality: 70,
        attributes: 'url'
      },
      {
        maxSize: 400,
        scaleType: "resize",
        prefix: "medium_",
        quality: 70,
        attributes: 'url'
      },
      {
        maxSize: 600,
        scaleType: "cover",
        prefix: "thumb_",
        quality: 70,
        attributes: 'thumb'
      }
    ]
    return {
      upload: (file) => {
        return new Promise((resolve, reject) => {
          //resize function
          function resize(file, variant) {
            return Jimp.read(file.buffer)
              .then(image => {
                //largest
                let destImg = path.join(strapi.config.appPath, 'public', `uploads/${variant.prefix}${file.hash}${file.ext}`)
                //change to preferences https://www.npmjs.com/package/jimp
                if (variant.scaleType !== "resize") {
                  //cover image
                  image.cover(variant.maxSize, variant.maxSize)
                } else {
                  //width, height
                  image.resize(Jimp.AUTO, variant.maxSize)
                }
                image.quality(variant.quality)
                image.write(destImg)
                file[variant.attributes] = `/uploads/${variant.prefix}${file.hash}${file.ext}`;
                return true
              })
              .catch(err => {
                return reject(err);
              });
          }
          
          //resize image in two variants
          var promise = resize(file, variants[0]);
          promise
            .then(function () {
              return resize(file, variants[1]);
            })
            .then(function () {
              return resize(file, variants[2]);
            })
            .then(function () {
              return resolve()
            })
            .catch(err => {
              return reject(err);
            });
        });
      },
      delete: (file) => {
        return Promise.all(variants.map(variant => {
          
            const filePath = path.join(strapi.config.public.path, `/uploads/${variant.prefix}${file.hash}${file.ext}`);
  
            if (!fs.existsSync(filePath)) {
              throw 'File doesn\'t exist';
            }
  
            // remove file from public/assets folder
            fs.unlinkSync(filePath, (err) => {
              if (err) {
                throw err
              }
  
            });
          
        }))
        
      }
    }
  }
};
