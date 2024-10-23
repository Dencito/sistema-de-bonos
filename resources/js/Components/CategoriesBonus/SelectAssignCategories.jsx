import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Select } from 'antd';
import React, { useState } from 'react'

const { Option } = Select

export const SelectAssignCategories = ({ setSelectedRowKeys, selectedRowKeys, categories }) => {
    const { successMsg, errorMsg } = useMessage();
    const [selectCategoryId, setSelectCategoryId] = useState(null)
    const handleAssignCategories = async () => {
        console.log({ users: selectedRowKeys, category_bonus_id: selectCategoryId })
        try {
            const { data } = await axios.post(`/categories-bonus/assign-multiple-users`, { users: selectedRowKeys, category_bonus_id: selectCategoryId });
            router.visit('/users', {
                preserveState: false,
            });
            console.log(data)
            data && successMsg(data?.message)
            setSelectCategoryId(null)
            setSelectedRowKeys([])
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
        }

    }
    return (
        <>
            {selectedRowKeys.length > 0 &&
                <div className=' flex gap-5'>
                    <Select
                        placeholder="Seleccionar categoria de bono"
                        onChange={value => setSelectCategoryId(value)}
                        style={{ width: 300 }}
                    >
                        {categories?.map(category => (
                            <Option key={category.id} value={category.id}>{category.name}</Option>
                        ))}
                    </Select>

                    <Button disabled={!selectCategoryId} onClick={() => handleAssignCategories()}>
                        Asignar categoria
                    </Button>
                </div>}
        </>
    )
}
