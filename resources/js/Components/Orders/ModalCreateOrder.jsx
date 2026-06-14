import { useState } from 'react';
import { Button, Form, Modal, Select, InputNumber, Typography, Input } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { router } from '@inertiajs/react';
import { useMessage } from '@contexts/MessageShow';
import { orderService } from '@services/api';

const { Option } = Select;
const { Text } = Typography;

export default function ModalCreateOrder({ products }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [showSalesWithdrawalModal, setShowSalesWithdrawalModal] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState('total');

  const [form] = Form.useForm();
  const [withdrawalForm] = Form.useForm();
  const { successMsg, errorMsg } = useMessage();

  const handleCloseModal = () => {
    setShowModal(false);
    form.resetFields();
    setTotal(0);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleSalesWithdrawal = async (values) => {
    try {
      setWithdrawalLoading(true);
      const response = await orderService.withdraw(values);
      successMsg(response.message);
      setShowSalesWithdrawalModal(false);
      withdrawalForm.resetFields();
      router.reload();
    } catch (error) {
      errorMsg(error?.response?.data?.message || 'Error al registrar el retiro.');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const showSalesWithdrawalConfirm = () => {
    setWithdrawalType('total');
    withdrawalForm.resetFields();
    setShowSalesWithdrawalModal(true);
  };

  const onCreate = async (values) => {
    try {
      setLoading(true);

      // Parse change from formatted string to number
      const changeValue =
        typeof values.change === 'string'
          ? parseFloat(values.change.replace(/,/g, ''))
          : values.change || 0;

      const payload = {
        ...values,
        products: [values.products],
        total,
        change: changeValue,
      };

      const response = await orderService.create(payload);
      response.success ? successMsg(response.message) : errorMsg(response.message);
      handleCloseModal();
      router.reload();
    } catch (error) {
      errorMsg(error?.response?.data?.message || 'Error al crear la orden.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total and set price and stock when product changes
  const handleProductsChange = (selectedProductId) => {
    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const price = selectedProduct ? parseFloat(selectedProduct.price) : 0;
    setUnitPrice(price);
    const quantity = form.getFieldValue('quantity') || 1;
    const calculatedTotal = price * quantity;
    setTotal(calculatedTotal);
    form.setFieldsValue({
      total: new Intl.NumberFormat('en-US').format(Math.trunc(calculatedTotal)),
      price: new Intl.NumberFormat('en-US').format(Math.trunc(price)),
      availableStock: selectedProduct
        ? new Intl.NumberFormat('en-US').format(Math.trunc(selectedProduct.quantity))
        : 0,
    });
    // Update change if paid_amount is set
    const paidAmount = form.getFieldValue('paid_amount') || 0;
    if (paidAmount > calculatedTotal) {
      const changeAmount = paidAmount - calculatedTotal;
      form.setFieldsValue({
        change: new Intl.NumberFormat('en-US').format(Math.trunc(changeAmount)),
      });
    } else {
      form.setFieldsValue({ change: new Intl.NumberFormat('en-US').format(Math.trunc(0)) });
    }
  };

  // Recalculate total when quantity changes
  const handleQuantityChange = (value) => {
    const quantity = value || 1;
    const calculatedTotal = unitPrice * quantity;
    setTotal(calculatedTotal);
    form.setFieldsValue({
      total: new Intl.NumberFormat('en-US').format(Math.trunc(calculatedTotal)),
    });
    // Also update change if paid_amount is set
    const paidAmount = form.getFieldValue('paid_amount') || 0;
    if (paidAmount > calculatedTotal) {
      const changeAmount = paidAmount - calculatedTotal;
      form.setFieldsValue({
        change: new Intl.NumberFormat('en-US').format(Math.trunc(changeAmount)),
      });
    } else {
      form.setFieldsValue({ change: new Intl.NumberFormat('en-US').format(Math.trunc(0)) });
    }
  };

  // Auto-fill change when paid_amount changes
  const handlePaidAmountChange = (value) => {
    const paidAmount = value || 0;
    if (paidAmount > total) {
      const changeAmount = paidAmount - total;
      form.setFieldsValue({
        change: new Intl.NumberFormat('en-US').format(Math.trunc(changeAmount)),
      });
    } else {
      form.setFieldsValue({ change: new Intl.NumberFormat('en-US').format(Math.trunc(0)) });
    }
  };

  return (
    <>
      <Button
        onClick={showSalesWithdrawalConfirm}
        className="mx-2"
        icon={<MinusCircleOutlined />}
        danger
      >
        Retiro de Ventas
      </Button>
      <Button onClick={handleOpenModal} className="mx-2" icon={<PlusOutlined />} type="primary">
        Crear Venta
      </Button>
      <Modal
        title="Retiro de Ventas"
        open={showSalesWithdrawalModal}
        onCancel={() => {
          setShowSalesWithdrawalModal(false);
          withdrawalForm.resetFields();
          setWithdrawalType('total');
        }}
        footer={null}
        width={500}
      >
        <Form
          form={withdrawalForm}
          layout="vertical"
          onFinish={handleSalesWithdrawal}
          autoComplete="off"
        >
          <Form.Item label="Tipo de Retiro" name="withdrawalType" initialValue="total">
            <Select onChange={(value) => setWithdrawalType(value)}>
              <Option value="total">Retiro Total</Option>
              <Option value="partial">Retiro Parcial</Option>
            </Select>
          </Form.Item>

          {withdrawalType === 'total' && (
            <div className="mb-4">
              <Text type="warning" style={{ fontSize: '14px' }}>
                ⚠️ Se retirará TODO el dinero acumulado de ventas.
              </Text>
            </div>
          )}

          {withdrawalType === 'partial' && (
            <Form.Item
              label="Monto a Retirar $"
              name="amount"
              rules={[
                {
                  required: true,
                  message: 'Por favor ingrese el monto a retirar.',
                },
                {
                  type: 'number',
                  min: 0.01,
                  message: 'El monto debe ser mayor a 0.',
                },
              ]}
            >
              <InputNumber
                placeholder="Ingrese el monto a retirar"
                style={{ width: '100%' }}
                min={0.01}
                precision={2}
              />
            </Form.Item>
          )}

          <Form.Item label="Descripción (Opcional)" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Ingrese una descripción o motivo del retiro"
              maxLength={1000}
            />
          </Form.Item>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowSalesWithdrawalModal(false);
                withdrawalForm.resetFields();
                setWithdrawalType('total');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={withdrawalLoading}
            >
              {withdrawalType === 'total' ? 'Confirmar Retiro Total' : 'Confirmar Retiro Parcial'}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        title="Crear Venta"
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onCreate}
          autoComplete="off"
          preserve={false}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            label="Productos"
            name="products"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione un producto.',
              },
            ]}
          >
            <Select
              placeholder="Seleccione un producto"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={handleProductsChange}
            >
              {products
                ?.filter((product) => product.quantity > 0)
                .map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item label="Precio unitario del producto" name="price">
            <InputNumber style={{ width: '100%' }} min={0} precision={0} disabled />
          </Form.Item>

          <Form.Item label="Stock disponible" name="availableStock">
            <InputNumber style={{ width: '100%' }} min={0} precision={0} disabled />
          </Form.Item>

          <Form.Item
            label="Cantidad a vender"
            name="quantity"
            rules={[
              {
                required: true,
                message: 'Por favor ingrese la cantidad.',
              },
              {
                type: 'number',
                min: 1,
                message: 'La cantidad debe ser mayor o igual a 1.',
              },
            ]}
          >
            <InputNumber
              placeholder="Ingrese la cantidad a vender"
              style={{ width: '100%' }}
              min={1}
              onChange={handleQuantityChange}
            />
          </Form.Item>

          <Form.Item
            label="Método de Pago"
            name="payment_method"
            rules={[
              {
                required: true,
                message: 'Por favor seleccione el método de pago.',
              },
            ]}
            initialValue="efectivo"
          >
            <Select placeholder="Seleccione método de pago" allowClear>
              <Option value="efectivo">Efectivo</Option>
              <Option value="tarjeta">Tarjeta</Option>
              <Option value="transferencia">Transferencia</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Total a Pagar $">
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1890ff',
              }}
            >
              ${new Intl.NumberFormat('en-US').format(Math.trunc(total))}
            </Text>
          </Form.Item>

          <Form.Item
            label="Monto Pagado $"
            name="paid_amount"
            rules={[
              {
                type: 'number',
                min: 0,
                message: 'El monto pagado debe ser mayor o igual a 0.',
              },
            ]}
          >
            <InputNumber
              placeholder="Ingrese el monto pagado"
              style={{ width: '100%' }}
              min={0}
              precision={0}
              onChange={handlePaidAmountChange}
            />
          </Form.Item>

          <Form.Item
            label="Vuelto $ | Monto pagado - Total a pagar"
            shouldUpdate={(prevValues, currentValues) => prevValues.change !== currentValues.change}
          >
            {({ getFieldValue }) => {
              const change = getFieldValue('change') ?? 0;
              return (
                <Text
                  style={{
                    fontSize: '32px',
                    color: 'red',
                    fontWeight: 'bold',
                  }}
                >
                  ${change}
                </Text>
              );
            }}
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Crear Venta
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
