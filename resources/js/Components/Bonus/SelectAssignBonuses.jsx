import { useMessage } from '@/Contexts/MessageShow';
import { router } from '@inertiajs/react';
import { Button, Select } from 'antd';
import React, { useState } from 'react'

const { Option } = Select

export const SelectAssignBonuses = ({ setSelectedRowKeys, selectedRowKeys, bonuses }) => {
    const { successMsg, errorMsg } = useMessage();
    const [selectBonusId, setSelectBonusId] = useState(null)
    
    const handleAssignBonuses = async () => {
        try {
            const { data } = await axios.post(`/bonuses/assign-multiple-users`, { users: selectedRowKeys, bonus_id: selectBonusId });
            router.visit('/users', {
                preserveState: false,
            });
            console.log(data)
            data && successMsg(data?.message)
            setSelectBonusId(null)
            setSelectedRowKeys([])
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
        }

    }

    const handleDestroyBonuses = async () => {
        try {
            const { data } = await axios.post(`/bonuses/destroy-multiple-users`, { users: selectedRowKeys, bonus_id: selectBonusId });
            router.visit('/users', {
                preserveState: true,
            });
            console.log(data)
            data && successMsg(data?.message)
            setSelectBonusId(null)
            setSelectedRowKeys([])
        } catch (error) {
            const { response: { data: dataError } } = error
            return errorMsg(dataError?.message)
        }

    }
    return (
        <>
            {selectedRowKeys.length > 0 &&
                <div className='flex flex-col md:flex-row gap-5'>
                    <Select
                        placeholder="Seleccionar bono"
                        onChange={value => setSelectBonusId(value)}
                        style={{ width: 300 }}
                    >
                        {bonuses?.map(bonus => (
                            <Option key={bonus.id} value={bonus.id}>{bonus.name}</Option>
                        ))}
                    </Select>

                    <Button disabled={!selectBonusId} onClick={() => handleAssignBonuses()}>
                        Asignar bonos
                    </Button>

                    <Button disabled={!selectBonusId} onClick={() => handleDestroyBonuses()}>
                        sacar bonos
                    </Button>
                </div>}
        </>
    )
}
