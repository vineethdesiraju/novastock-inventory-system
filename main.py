from fastapi import Depends,FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules import Products
from Database_configuration import session,engine
import Database_modules 
from sqlalchemy.orm import Session

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

Database_modules.base.metadata.create_all(bind=engine)

@app.get("/")
def greet():
    return("Welcome")

products = [
Products(id=1,name="phone",description="budget",price=999,quantity=10),
Products(id=2,name="laptop",description="gaming",price=99999,quantity=5),
Products(id=3,name="mouse",description="gaming",price=9999,quantity=5),
Products(id=5,name="keyboard",description="gaming",price=99949,quantity=5),
Products(id=7,name="cpu",description="gaming",price=99993,quantity=53)
]
def get_db():
    db=session()
    try:
        yield(db)
    finally:
        db.close()

def init_db():
    db=session()
    try:
        if db.query(Database_modules.Product).count() == 0:
            for product in products:
                db.add(Database_modules.Product(**product.model_dump()))
            db.commit()
    finally:
        db.close()
init_db()

@app.get("/products")
def get_all_products(db:Session = Depends(get_db)):
    db_products= db.query(Database_modules.Product).all()
    return(db_products)

@app.get("/products/{id}")
def greet_all_products_id(id:int,db:Session = Depends(get_db)):
    db_product=db.query(Database_modules.Product).filter(Database_modules.Product.id==id).first()
    if db_product:
            return db_product
    return ("Not Found")

@app.post("/products")
def add_new_product(product:Products,db:Session = Depends(get_db) ):
    db.add(Database_modules.Product(**product.model_dump()))
    db.commit()
    return product

@app.put("/products/{id}")
def update_product(id:int,product:Products,db:Session = Depends(get_db)):
    #we can update only if the product exists,,,so check for existence and then update
    db_product=db.query(Database_modules.Product).filter(Database_modules.Product.id==id).first()
    if db_product: #if the product with the id exists
        db_product.name=product.name
        db_product.description=product.description
        db_product.quantity=product.quantity
        db_product.price=product.price
        db.commit()
    else:
        return("Error in updating the values")

@app.delete("/products/{id}")
def delete_product(id:int,db:Session = Depends(get_db)):
    db_product=db.query(Database_modules.Product).filter(Database_modules.Product.id==id).first()
    if db_product: #if the product with the id exists
        db.delete(db_product)
        db.commit()
    else:
        return("Error in deleting the product")






