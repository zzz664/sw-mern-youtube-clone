const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;                  //salt가 몇 글자인지 나타내는 변수
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

//salt를 이용해서 비밀번호 암호화
userSchema.pre('save', function(next) {                          //pre는 schema가 save되기전에 호출됨
    var user = this;

    if(user.isModified('password')) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if(err) return next(err);
            
            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) return next(err);
            
                user.password = hash;
                next();
            })
        });
    }

    else {
        next();
    }
});

userSchema.methods.comparePassword = function(plainPassword, callbackfunc) {
    bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
        if(err) return callbackfunc(err);
        callbackfunc(null, isMatch);
    });
};

//jsonwebtoken을 이용하여 토큰생성
// user._id + 'secretToken'이 token임, 'secretToken'을 넣으면 user._id가 나와서 누구인지 식별 가능하다.
userSchema.methods.genToken = function(callbackfunc) {
    var user = this;

    var token = jwt.sign(user._id.toHexString(), 'secretToken');

    user.token = token;

    user.save(function(err, userInfo) {
        if(err) return callbackfunc(err);    
        callbackfunc(null, userInfo);
    });
};

userSchema.statics.findByToken = function(token, callbackfunc) {
    var user = this;

    //토큰 복호화
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //user id를 이용하여 user를 찾고 db의 토큰과 클라이언트의 토큰이 일치하는지 확인
        user.findOne({"_id": decoded, "token": token}, function(err, userInfo) {
            if(err) return callbackfunc(err);
            callbackfunc(null, userInfo);
        });
    });
};

const User = mongoose.model('User', userSchema);

module.exports = {User};