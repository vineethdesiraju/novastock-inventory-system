from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
base=declarative_base()
class Product(base):
    __tablename__="Product"
    id=Column(Integer,primary_key=True, index=True)
    name=Column(String)
    description=Column(String)
    price=Column(Float)
    quantity=Column(Integer)
