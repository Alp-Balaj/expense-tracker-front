import { useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";

function CategoryList() {
    const [categories, setCategories] = useState([]);
    const { getAllData } = useAuthorizationApi();
    
    const fetchCategories = async () => {
        try {
            const data = await getAllData('api/Category');
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };
    
    useEffect(() => {
        fetchCategories();
        return () => {};
    }, []);

    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Categories</h2>
            <ul>
                {categories.map(category => (
                    <li key={category.id}>{category.name} - {category.description} - {category.categoryTypeId} - {category.color}</li>
                ))}
            </ul>
        </div>  
    );
}

export default CategoryList;