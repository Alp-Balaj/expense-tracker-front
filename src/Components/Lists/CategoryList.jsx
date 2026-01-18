import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi.tsx";
import { useAuth } from "../../Authorization/AuthContext.jsx";
import CategoryForm from "../Forms/CategoryForm";

function CategoryList() {
    const { accessToken, isAuthReady } = useAuth();

    const [categories, setCategories] = useState([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getAllData('api/Category');
            setCategories(data);
        } catch (error) {
            if (error?.response?.status !== 401) {
                console.error(error);
            }
        }
    }, [getAllData]);
    
    useEffect(() => {
        if (!isAuthReady || !accessToken) return;
        fetchCategories();
        return () => {};
    }, [fetchCategories, isAuthReady, accessToken]);

    const addCategory = () => {
        setEditingCategory(null);
        setIsFormOpen(true);
    };

    const editCategory = (category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data) => {
        if (editingCategory != null) {
            console.log("UPDATE", data);
            await putData('api/Category', data);
        } else {
            console.log("CREATE", data);
            await postData('api/Category', data);
        }

        setEditingCategory(null);
        setIsFormOpen(false);
        await fetchCategories();
    };


    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Categories</h2> <button onClick={addCategory}>Add Category</button>
            <ul>
                {categories.map(category => (
                    <li key={category.id}>
                        {category.name} - {category.description} - {category.categoryTypeId} - {category.color}
                        <button onClick={() => editCategory(category)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isFormOpen && (
                <CategoryForm
                    key={editingCategory?.id ?? "new"}
                    row={editingCategory}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}

export default CategoryList;