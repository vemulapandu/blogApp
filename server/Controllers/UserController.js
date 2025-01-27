const db = require('../utils/db');
const { hashPassword, compare } = require('../utils/hashPass');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    // console.log(typeof User.findOne);
    try {
        const { fullname, email, password } = req.body;
        const user = await db.User.findAll({ where: { email } });
        if(user.length!==0){
            return res.status(404).json({
                status: 'Email ALready Exists'
            });
        }
        const hash = await hashPassword(password);
        const newUser = await db.User.create({
            fullname: fullname,
            email: email,
            password: hash
        });
        console.log(newUser);
        return res.status(200).json({
            status: 'success'
        });
    } catch (err) {
        console.log("test:",err);
        return res.status(404).json({
            status: 'Signup Error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.User.findAll({ where: { email } });
        if(user.length===0){
            return res.status(404).json({
                status: 'incorrect email'
            });
        }
        const check = await compare(password, user[0].password);
        if(check){
            const access_token = jwt.sign({user:user[0]},process.env.SECRET_ACCESS_TOKEN);
            res.cookie("jwt",access_token,{
                expires: new Date(Date.now() + 172800000),
                httponly: true
            });
            return res.status(200).json({
                status: 'success, user authenticated',
                access_token,
            });
        }else{
            return res.status(404).json({
                status: 'incorrect password'
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(404).json({
            status: 'login catch error'
        });
    }
};

const deleteUser = async (req,res) => {
    try{
        const {password} = req.body;
        const {email} = req.body.user;
        const hashpass = req.body.user.password;
        const check = await compare(password,hashpass);
        if(check){
            await db.User.destroy({where:{email}});
            res.cookie("jwt",null,{
                expires: Date.now(),
                httponly: true
            });
            return res.status(200).json({
                status: 'success, user deleted'
            });
        }else{
            return res.status(404).json({
                status: 'invalid password'
            });
        }
    }catch(err){
        console.log(err);
        return res.status(404).json({
            status: 'deleteUser catch error'
        });
    }
};

const changePassword = async (req,res) => {
    try{
        const {oldpass,newpass} = req.body;
        const {email} = req.body.user;
        const hashpass = req.body.user.password;
        const check = await compare(oldpass,hashpass);
        if(!check){
            return res.status(404).json({
                status: 'Old Password is Incorrect'
            });
        }
        const newhash = await hashPassword(newpass);
        await db.User.update({password:newhash,updatedAt:db.Sequelize.literal("CURRENT_TIMESTAMP")},{where:{email}});
        const user = await db.User.findAll({ where: { email } });
        const access_token = jwt.sign({user:user[0]},process.env.SECRET_ACCESS_TOKEN);
            res.cookie("jwt",access_token,{
                expires: new Date(Date.now() + 172800000),
                httponly: true
            });
        return res.status(200).json({
            status: 'success, password changed',
            access_token
        });
    }catch(err){
        console.log(err);
        return res.status(404).json({
            status: 'changePassword catch error'
        });
    }
}

const logout = async (req,res) => {
    try{
        if(!req.body.user){
            return res.status(404).json({
                status: 'No User is logged in'
            });
        }
        res.cookie("jwt",null,{
            expires: new Date(Date.now()),
            httponly: true
        });
        return res.status(200).json({
            status: 'success, logged out'
        });
    }catch(err){
        console.log(err);
        return res.status(404).json({
            status: 'logout catch error'
        });
    }
}

module.exports = { signup, login, deleteUser,changePassword,logout};