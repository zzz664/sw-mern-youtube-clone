const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/keys');

const {auth} = require('./middleware/auth');
const {User} = require('./models/User');

//application/x-www-form-urlencoded 형태를 가져올 수 있게함
app.use(bodyParser.urlencoded({extended: true}));
//application/json 형태를 가져올 수 있게함
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB connected!'))
.catch(() => console.log(err));

app.get('/', (req, res) => res.send('Hello World!'));

//회원가입 정보를 client에서 가져오면 DB에 저장
//req.body example -> body-parser를 이용하기 때문.
/*
{
    id: "id",
    password: "password"
}
*/
app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)

    user.save((err, userInfo) => {
        if(err) 
            return res.json({registerSuccess: false, err})

        return res.status(200).json({registerSuccess: true})
    })
});

app.post('/api/users/login', (req, res) => {
    //요청된 email을 db에서 찾기
    User.findOne({email: req.body.email}, (err, userInfo) => {
        if(!userInfo) {
            return res.json({
                loginSuccess: false,
                message: "존재하지 않는 이메일입니다."
            });
        }
        //요청된 email이 유효하면 비밀번호가 맞는지 확인
        userInfo.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({
                loginSuccess: false,
                message: "비밀번호가 틀렸습니다."
            });
            //유저토큰 생성
            userInfo.genToken((err, userInfo) => {
                if(err) return res.status(400).send(err); //400은 오류가 있다는 뜻
                //토큰을 저장한다. (쿠키, 로컬스토리지, 세션 등등..)
                res.cookie("x_auth", userInfo.token).status(200).json({
                    loginSuccess: true,
                    userId: userInfo._id
                });
            });
        });
    });
});

//auth -> 로그인유무, 유저의 역할, 권한 체크 등을 위해서 필요
//1.쿠기의token을 server로 전송 후 decode.
//2.복호화하면 user id가 나옴
//3.user id를 이용하여 db에서 user를 찾은 후 쿠키에서 받아온 token을 유저도 가지고 있는지 확인
//auth 파라미터는 middleware로 콜백함수 호출 전 실행됨
app.get('/api/users/auth', auth, (req, res) => {
    res.status(200).json({
        _id: req.userInfo._id,
        isAdmin: req.userInfo.role === 0 ? false : true,
        isAuth: true,
        email: req.userInfo.email,
        name: req.userInfo.name,
        lastname: req.userInfo.lastname,
        role: req.userInfo.role,
        image: req.userInfo.image
    });
});

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.userInfo._id}, {token: ""}, (err, userInfo) => {
        if(err) return res.json({logoutSuccess: false, err});
        return res.status(200).send({logoutSuccess: true});
    })
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));