/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var mongoose = require("mongoose");
require("dotenv").config();
var ObjectId = require("mongodb").ObjectID;

mongoose.connect(process.env.DB || "mongodb://localhost/exercise-track", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const Schema = mongoose.Schema;

const threadSchema = new Schema({
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: [{ _id: String, text: String, created_on: Date, reported: Boolean }],
  replycount: Number
});

const replySchema = new Schema({
  text: String,
  created_on: Date,
  reported: Boolean,
  delete_password: String
});

const updateReply = (req, res) => {
  const thread = req.params.board;
  const id = req.body.thread_id;
  const rid = req.body.reply_id;
  const password = req.body.delete_password;
  const Reply = mongoose.model(thread + " replies", replySchema);
  const board = mongoose.model(thread, threadSchema);
  Reply.findOneAndUpdate(
    { _id: rid },
    { reported: true },
    { new: true },
    (err, data) => {
      if (err) {
        console.log("err90");
      } else {
        console.log(data);
      }
    }
  );
  board.findById(id, (err, thre) => {
    if (err) {
      console.log("err78");
    } else {
      console.log(thre);
      for (let i = 0; i < thre.replies.length; i++) {
        if (thre.replies[i]._id == rid) {
          thre.replies[i].reported = true;
          break;
        }
      }
      thre.save((err, data) => {
        if (err) {
          console.log("err98");
        } else {
          console.log("thre");
        }
      });
    }
  });
};

const deleteThread = (req, res) => {
  const board = mongoose.model(req.params.board, threadSchema);
  const id = req.body.thread_id;
  const password = req.body.delete_password;
  board.find({ _id: new ObjectId(id) }, (err, data) => {
    console.log("hi", data, password, data.delete_password);
    if (err) {
      res.send("-- no item exists -- ");
    } else {
      if (data[0].delete_password == password) {
        console.log("hey you");
        board.findByIdAndRemove({ _id: id }, (err, data) => {
          if (err) {
            res.send("incorrect password");
          } else {
            res.send("success");
          }
        });
      }
    }
  });
};

const deleteReply = (req, res) => {
  const thread = req.params.board;
  const id = req.body.thread_id;
  const rid = req.body.reply_id;
  const password = req.body.delete_password;
  const Reply = mongoose.model(thread + " replies", replySchema);
  const board = mongoose.model(thread, threadSchema);
  Reply.find({ _id: rid }, (err, data) => {
    if (err) {
      console.log("err34");
    } else {
      if (data[0].delete_password == password) {
        data[0].text = "[deleted]";
        data[0].save((err, dat) => {
          if (err) console.log("err245");
          else {
            console.log(dat);
          }
        });
        board.findById(id, (err, thre) => {
          if (err) {
            console.log("err78");
          } else {
            for (let i = 0; i < thre.replies.length; i++) {
              if (thre.replies[i]._id == rid) {
                thre.replies[i].text = "[deleted]";
                break;
              }
            }
            thre.save((err, data) => {
              if (err) {
                console.log("err98");
              } else {
                console.log("thre");
              }
            });
          }
        });
      }
    }
  });
};

const updateThread = (req, res) => {
  const board = mongoose.model(req.params.board, threadSchema);
  const id = req.body.thread_id;
  board.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { reported: true, bumped_on: new Date() },
    { new: true },
    (err, data) => {
      if (err) {
        console.log("err11");
      } else {
        console.log(data);
      }
    }
  );
};

const findReply = (req, res) => {
  const thread = req.params.board;
  const id = req.query.thread_id;
  const board = mongoose.model(thread, threadSchema);
  board.find({ _id: id }, (err, data) => {
    if (err) {
      return err;
    } else {
      res.json(data[0]);
    }
  });
};

const findThread = (req, res) => {
  const board = mongoose.model(req.params.board, threadSchema);
  board
    .find({})
    .sort({ bumped_on: -1 })
    .limit(10)
    .select({ delete_password: 0, __v: 0 })
    .exec((err, docs) => {
      if (err) {
        return err;
      } else {
        docs.forEach(doc => {
          doc.replycount = doc.replies.length;
          if (doc.replies.length > 3) {
            doc.replies = doc.replies.slice(-3);
          }
        });
      }
      res.json(docs);
    });
};

//this objs schema should match reply + id
const createReply = (req, res) => {
  const object1 = {
    board: req.params.board,
    text: req.body.text,
    id: req.body.thread_id,
    password: req.body.delete_password
  };

  const Reply = mongoose.model(object1.board + " replies", replySchema);
  var newReply = new Reply({
    text: object1.text,
    created_on: new Date(),
    reported: false,
    delete_password: object1.password
  });
  newReply.save((err, data) => {
    console.log(data);
    if (err) {
      console.log(err);
    } else {
      const thread = mongoose.model(object1.board, threadSchema);
      thread.findOneAndUpdate(
        { _id: object1.id },
        {
          $push: {
            replies: {
              _id: data._id,
              text: data.text,
              created_on: data.created_on,
              reported: data.reported
            }
          },
          $inc: { replycount: 1 }
        },
        { new: true },
        (err, data) => {
          if (err) {
            console.log("err123");
          } else {
            console.log(data);
          }
        }
      );
      res.redirect("/b/" + object1.board + "/" + object1.id);
    }
  });
};

const createThread = (req, res) => {
  const object0 = {
    text: req.body.text,
    password: req.body.delete_password,
    thread: req.params.board
  };
  const Thread = mongoose.model(object0.thread, threadSchema);
  var newThread = new Thread({
    text: object0.text,
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: object0.password,
    replies: [],
    replycount: 0
  });
  newThread.save((err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
  res.redirect("/b/" + object0.thread + "/");
};

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .get(findThread)
    .post(createThread)
    .put(updateThread)
    .delete(deleteThread);

  app
    .route("/api/replies/:board")
    .get(findReply)
    .post(createReply)
    .put(updateReply)
    .delete(deleteReply);
};
