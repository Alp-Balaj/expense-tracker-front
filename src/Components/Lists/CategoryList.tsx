import { useCallback, useEffect, useState } from "react";
import { useAuthorizationApi } from "../../Hooks/useAuthorizationApi";
import { useAuth } from "../../Authorization/AuthContext";
import CategoryForm from "../Forms/CategoryForm";
import type { Category } from "../../Models/Category";
import type { AxiosError } from "axios";

export default function CategoryList() {
    const { accessToken, isAuthReady } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const { getAllData, postData, putData } = useAuthorizationApi();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getAllData<Category[]>('api/Category');
            setCategories(data);
        } catch (e: unknown) {
            const err = e as AxiosError;
            if (err.response?.status !== 401) {
            console.error(err);
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

    const editCategory = (category: Category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleSubmit = async (data: Category) => {
        if (editingCategory != null) {
            await putData<Category>('api/Category', data);
        } else {
            await postData<Category>('api/Category', data);
        }

        setEditingCategory(null);
        setIsFormOpen(false);
        await fetchCategories();
    };


    return (
        <div style={{backgroundColor: '#fff'}}>
            <h2>Categories</h2> <button onClick={addCategory}>Add Category</button>
            <ul>
                {Array.isArray(categories) && categories.map(category => (
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