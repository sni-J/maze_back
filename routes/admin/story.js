var express = require('express');
var router = express.Router();
var multer = require('multer');
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');

function deleteFile(filePath){
    fs.exists(filePath, function (exists) {
        if (exists) {
            fs.unlink(filePath, function (err) { 
                if (err) throw err; 
                console.log('successfully deleted'); 
            });
        }
    });
}

const upload = multer({
   storage: multer.diskStorage({
       destination: function (req, file, cb){
           cb(null, './public/story');
       },
       filename: function (req, file, cb){
           crypto.pseudoRandomBytes(16, function (err, raw){
              if (err) { return cb(err); }
              cb(null, raw.toString('hex') + path.extname(file.originalname));
           });
       },
   }),
});

var Story = require('../../models/story');
var validateAdmin = require('../login').validateAdmin;

router.get('/:id/:pwd', function(req, res){
    if (validateAdmin(req.params.id, req.params.pwd)) {
        Story.find({}).sort({classType: 1, num: 1, storyType: 1}).exec(function (err, stories) {
            if (err) {
                //console.error(err);
                res.json({
                    result: 0,
                    error: err.errmsg
                });
                return;
            }
            res.json({
                result: 1,
                stories: stories
            });
        });
        return;
    }
    res.json({
        result: 0,
        error: 'user validating failed'
    });
});

router.post('/:id/:pwd', upload.single('file'), function(req, res){
    if (validateAdmin(req.params.id, req.params.pwd)) {
        if (req.body.num == undefined || req.body.classType == undefined || req.body.storyType == undefined
        || req.file.filename == undefined || req.file.path == undefined){
            res.json({
                result: 0,
                error: 'Not enough request'
            });
            return;
        }

        var story = new Story();
        story.num = Number(req.body.num);
        story.classType = req.body.classType;
        story.storyType = req.body.storyType;
        story.fileURL = '/images/story/' + req.file.filename;
        story.filePath = req.file.path;

        story.save(function (err) {
            if (err) {
                //console.error(err);
                deleteFile(req.file.path);
                res.json({
                    result: 0,
                    error: err.errmsg
                });
                return;
            }
            res.json({result: 1});
        });
        return;
    }
    deleteFile(req.file.path);
    res.json({
        result: 0,
        error: 'user validating failed'
    });
});

router.delete('/:id/:pwd/:fileName', function(req, res){
    if (validateAdmin(req.params.id, req.params.pwd)) {
        const fileURL = "/images/story/" + req.params.fileName;

        Story.findOneAndDelete({fileURL: fileURL},
            function (err, doc) {
                deleteFile(doc.filePath);
                if (err) {
                    //console.error(err);
                    res.status(500).json({
                        error: err.errmsg
                    });
                    return;
                }
                res.status(204).end();
        });
        return;
    }
    res.json({
        result: 0,
        error: 'user validating failed'
    });
});

module.exports = router;