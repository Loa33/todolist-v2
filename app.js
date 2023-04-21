const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
let tasks = [];
const workTasks = [];
const day = _.capitalize(new Date().toLocaleString('es-la', {weekday:'long'}));

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

const uri = "mongodb+srv://admin-loana:Sofiabebe%401622@cluster0.q4biuxp.mongodb.net/todolistDB";
mongoose.connect(uri);

const {Schema} = mongoose;

const itemsSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	isChecked: Boolean
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new Schema({
	name: String,
	items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

async function findItems(){
	try{
		let result = await Item.find({});
		return result
	}catch(e){
		console.log(e);
	}
}

app.get("/",async (req, res) => {
	await findItems().then(result=>{
		res.render("list", { listTitle: day, tasks:  result});
	});
	
});

app.post("/check",  async(req,res)=>{
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	console.log(checkedItemId);
	if(listName === day){
		await Item.findById(checkedItemId).then(async result=>{
			if(result.isChecked == true ){
				await Item.findByIdAndUpdate(checkedItemId, {isChecked: false}).then(()=>{
					res.redirect("/");
				});
			}else{
				await Item.findByIdAndUpdate(checkedItemId, {isChecked: true}).then(()=>{
					res.redirect("/");
				});
			}
			
		});
	}else{
		await List.findOne({"name": listName}, {"items":{$elemMatch : {_id: checkedItemId}}})
				.then(async result=>{
			if(result.items[0].isChecked == true){
				result.items[0].isChecked = false;
				await result.save();
				res.redirect("/"+listName);
			}else{
				result.items[0].isChecked = true;
				await result.save();
				res.redirect("/"+listName);
			}
		});
	}
})

app.post("/delete", async(req,res)=>{
	const deleteItemId = await req.body.delete;
	const listName = req.body.listName;

	if(listName === day){
		await Item.findByIdAndDelete(deleteItemId).then(()=>{
			res.redirect("/");
		});
	}else{
		await List.findOneAndUpdate({"name": listName},{$pull:{items: {_id: deleteItemId}}}).then(()=>{
			res.redirect("/"+listName);
		})

	}
	
})

app.post("/", async(req, res) => {
	let task = req.body.taskInput;
	const listName = req.body.list;
	const item = new Item({
		name: task,
		isChecked: false,
	})
	
	if(req.body.list == day){
		await item.save();
		res.redirect("/");
	}else{
		await List.findOne({name: listName}).then(async result=>{
			result.items.push(item);
			result.save();
			res.redirect("/"+listName);
		})
		
	}
});

app.get("/:customListName", async (req,res) =>{
	const customListName = _.capitalize(req.params.customListName);

	await List.findOne({name: customListName}).then(result=>{
		if(result){
			res.render("list", {listTitle: customListName[0].toUpperCase() + customListName.substring(1), tasks: result.items});
		}else{
			const list = new List({
				name: customListName,
				items: []
			})
			list.save();
			res.redirect("/"+customListName);
		}
	})
	
})


app.listen(3000, function () {
	console.log("listening on port 3000");
});



